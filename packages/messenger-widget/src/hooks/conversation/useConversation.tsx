/* eslint-disable max-len */
import {
    DeliveryInformation,
    EncryptionEnvelop,
    Envelop,
} from '@dm3-org/dm3-lib-messaging';
import { normalizeEnsName } from '@dm3-org/dm3-lib-profile';
import { Conversation } from '@dm3-org/dm3-lib-storage/dist/new/types';
import { useContext, useEffect, useMemo, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { DM3ConfigurationContext } from '../../context/DM3ConfigurationContext';
import { DeliveryServiceContext } from '../../context/DeliveryServiceContext';
import { StorageContext } from '../../context/StorageContext';
import { TLDContext } from '../../context/TLDContext';
import { DM3Configuration } from '../../interfaces/config';
import { ContactPreview, getEmptyContact } from '../../interfaces/utils';
import { useMainnetProvider } from '../mainnetprovider/useMainnetProvider';
import { hydrateContract } from './hydrateContact';
import { ethers } from 'ethers';

const DEFAULT_CONVERSATION_PAGE_SIZE = 10;

export const useConversation = (config: DM3Configuration) => {
    const mainnetProvider = useMainnetProvider();
    const { dm3Configuration } = useContext(DM3ConfigurationContext);
    const { account } = useContext(AuthContext);
    const { fetchIncomingMessages, isInitialized: deliveryServiceInitialized } =
        useContext(DeliveryServiceContext);
    const {
        getConversations: getConversationsFromStorage,
        addConversationAsync: storeConversationAsync,
        initialized: storageInitialized,
        toggleHideContactAsync,
    } = useContext(StorageContext);

    const { resolveAliasToTLD, resolveTLDtoAlias } = useContext(TLDContext);

    const [contacts, setContacts] = useState<Array<ContactPreview>>([]);
    const [selectedContactName, setSelectedContactName] = useState<
        string | undefined
    >(undefined);
    const [conversationsInitialized, setConversationsInitialized] =
        useState<boolean>(false);

    const conversationCount = useMemo(() => contacts.length, [contacts]);

    const selectedContact = useMemo(() => {
        return contacts.find(
            (contact) =>
                contact.contactDetails.account.ensName === selectedContactName,
        );
    }, [selectedContactName, contacts]);

    const _setContactsSafe = (newContacts: ContactPreview[]) => {
        setContacts((prev) => {
            //We do not want to add duplicates to the list
            const withoutDuplicates = prev.filter(
                (existingContact) =>
                    !newContacts.some(
                        (newContact) =>
                            newContact.contactDetails.account.ensName ===
                            existingContact.contactDetails.account.ensName,
                    ),
            );

            return [...withoutDuplicates, ...newContacts].sort(
                (a, b) => b.updatedAt - a.updatedAt,
            );
        });
    };

    //For now we do not support pagination hence we always fetch all pages
    useEffect(() => {
        setConversationsInitialized(false);
        setSelectedContactName(undefined);
        setContacts([]);
        const init = async () => {
            if (
                !account ||
                !storageInitialized ||
                !deliveryServiceInitialized
            ) {
                return;
            }

            const conversations = await Promise.all([
                //Get the last 5 conversations from the storage
                getConversationsFromStorage(DEFAULT_CONVERSATION_PAGE_SIZE, 0),
                //Get the conversations that have been added to the DS in absence of the user
                getConversationsFromDeliveryService(),
            ]);
            console.log('loaded conversations', conversations);

            //Flatten the conversations and remove duplicates
            conversations
                .flat()
                .filter(
                    (conversation, index, self) =>
                        index ===
                        self.findIndex(
                            (t) =>
                                t.contactEnsName ===
                                conversation.contactEnsName,
                        ),
                )
                //Add the conversations to the list
                .forEach((conversation) => _addConversation(conversation));

            initDefaultContact();
            setConversationsInitialized(true);
        };
        init();
    }, [storageInitialized, account, deliveryServiceInitialized]);

    const initDefaultContact = async () => {
        if (config.defaultContact) {
            const defaultContactTldName = normalizeEnsName(
                config.defaultContact,
            );
            const aliasName = await resolveTLDtoAlias(defaultContactTldName);
            const defaultContactIsUser =
                account?.ensName === normalizeEnsName(aliasName!);

            //We do not want to add the default contact if it is the user
            if (defaultContactIsUser) {
                return;
            }

            const contractHasAlreadyBeenAdded = contacts.some(
                (contact) =>
                    contact.contactDetails.account.ensName ===
                    normalizeEnsName(aliasName!),
            );
            if (!contractHasAlreadyBeenAdded) {
                //I there are no conversations yet we add the default contact
                const defaultConversation: Conversation = {
                    contactEnsName: normalizeEnsName(aliasName!),
                    contactProfileLocation: [defaultContactTldName],
                    previewMessage: undefined,
                    isHidden: false,
                    updatedAt: new Date().getTime(),
                };

                const hydratedDefaultContact = await hydrateContract(
                    mainnetProvider,
                    defaultConversation,
                    resolveAliasToTLD,
                    dm3Configuration.addressEnsSubdomain,
                );
                _setContactsSafe([hydratedDefaultContact]);
            }
        }
    };

    const getConversationsFromDeliveryService = async (): Promise<
        Conversation[]
    > => {
        //The DS does not exposes an endpoint to fetch pending conversations. Hence we're using the fetchIncomingMessages method.
        //We can make some optimizations here if we use the messages fetched from incomingMessages in useMessages aswell.
        //This would require a refactor of the useMessages away from a contact based model.
        //Maybe we decide to to this in the future, for now we're going to keep it simple
        const incomingMessages: Envelop[] = await fetchIncomingMessages(
            account?.ensName as string,
        );

        //It might be possible that the same contact has sent multiple messages. We only want to retrieve the TLDAlias for each contact once
        const uniqueSenders = new Set(
            incomingMessages.map(
                (message) =>
                    (
                        message.metadata!
                            .deliveryInformation as DeliveryInformation
                    ).from,
            ),
        );

        //For each unique sender we're going to resolve the TLD name to the TLDAlias
        //We have to do it before processing incoming conversations to warm up the cache.
        const resolvedTldAliases = await Array.from(uniqueSenders).reduce(
            async (acc, tldName) => {
                const aliasName = await resolveTLDtoAlias(tldName);
                return {
                    ...acc,
                    [tldName]: aliasName,
                };
            },
            {} as Promise<{ [tldName: string]: string }>,
        );

        //Every pending conversation is going to be added to the conversation list
        const incommingConversations = await Promise.all(
            incomingMessages.map(async (pendingMessage: Envelop) => {
                //TODO might be necessary to resolve alias
                const contactTldName = (
                    pendingMessage.metadata!
                        .deliveryInformation as DeliveryInformation
                ).from;

                //resolves the TLD name. That name becomes the identifier for the conversation. The alias name is the name that is displayed in the conversation list
                //Every name should already be part of resolvedTldAliases. resolveTLDtoAlias is only there as a fallback
                const aliasName =
                    resolvedTldAliases[contactTldName] ??
                    (await resolveTLDtoAlias(contactTldName));

                return {
                    contactProfileLocation: [contactTldName],
                    contactEnsName: aliasName,
                    updatedAt: new Date().getTime(),
                    isHidden: false,
                };
            }),
        );

        //filter duplicates
        return incommingConversations.filter((conversation: Conversation) => {
            return !contacts.some(
                (current) =>
                    current.contactDetails.account.ensName ===
                    conversation.contactEnsName,
            );
        });
    };

    const addConversation = async (_ensName: string) => {
        const contactTldName = normalizeEnsName(_ensName);
        //rrsolves the TLD name. That name becomes the identifier for the conversation
        const aliasName = await resolveTLDtoAlias(contactTldName);

        const defaultProfileLocation = ethers.utils.isAddress(contactTldName)
            ? normalizeEnsName(
                  contactTldName + dm3Configuration.addressEnsSubdomain,
              )
            : contactTldName;

        const newConversation: Conversation = {
            contactEnsName: aliasName,
            contactProfileLocation: [defaultProfileLocation], //(ID)
            isHidden: false,
            previewMessage: undefined,
            updatedAt: new Date().getTime(),
        };

        //Adds the conversation to the conversation state
        const conversationPreview = _addConversation(newConversation);
        //Add the contact to the storage in the background
        storeConversationAsync(aliasName, [contactTldName]);
        return conversationPreview;
    };

    const loadMoreConversations = async (): Promise<number> => {
        const hasDefaultContact = config.defaultContact;
        //If a default contact is set we have to subtract one from the conversation count since its not part of the conversation list
        const conversationCount = hasDefaultContact
            ? contacts.length - 1
            : contacts.length;
        //We calculate the offset based on the conversation count divided by the default page size
        //offset * pagesize equals the amount of conversations that will be skipped
        const offset = conversationCount / DEFAULT_CONVERSATION_PAGE_SIZE;
        console.log('load more conversations', conversationCount, offset);
        const conversations = await getConversationsFromStorage(
            DEFAULT_CONVERSATION_PAGE_SIZE,
            Math.floor(offset),
        );

        //add every conversation
        conversations.forEach((conversation) => _addConversation(conversation));
        return conversations.length;
    };

    /**
     * When a conversation is added via the AddContacts dialog it should appeat in the conversation list immediately.
     * Hence we're doing a hydrate here asynchroniously in the background
     */
    const hydrateExistingContactAsync = async (contact: ContactPreview) => {
        const conversation: Conversation = {
            contactEnsName: contact.contactDetails.account.ensName,
            contactProfileLocation: contact.contactProfileLocation,
            previewMessage: undefined,
            isHidden: contact.isHidden,
            updatedAt: contact.updatedAt,
        };
        const hydratedContact = await hydrateContract(
            mainnetProvider,
            conversation,
            resolveAliasToTLD,
            dm3Configuration.addressEnsSubdomain,
        );
        setContacts((prev) => {
            return prev.map((existingContact) => {
                //Find the contact in the list and replace it with the hydrated one
                if (
                    existingContact.contactDetails.account.ensName ===
                    conversation.contactEnsName
                ) {
                    return hydratedContact;
                }
                return existingContact;
            });
        });
        return hydratedContact;
    };

    const hideContact = (_ensName: string) => {
        const ensName = normalizeEnsName(_ensName);
        _toggleHideContact(ensName, true);
        setSelectedContactName(undefined);
    };

    const unhideContact = (contact: ContactPreview) => {
        _toggleHideContact(contact.contactDetails.account.ensName, false);
        const unhiddenContact = {
            ...contact,
            isHidden: false,
        };
        setSelectedContactName(unhiddenContact.contactDetails.account.ensName);
        hydrateExistingContactAsync(unhiddenContact);
    };

    const updateConversationList = (
        conversation: string,
        updatedAt: number,
    ) => {
        setContacts((prev) => {
            const newContactList = prev.map((contact) => {
                if (contact.contactDetails.account.ensName === conversation) {
                    return {
                        ...contact,
                        updatedAt: updatedAt,
                    };
                }
                return contact;
            });
            // Sort's the contact list in DESC order based on updatedAt property
            return newContactList.sort((a, b) => b.updatedAt - a.updatedAt);
        });
    };

    const _toggleHideContact = (_ensName: string, isHidden: boolean) => {
        const ensName = normalizeEnsName(_ensName);
        setContacts((prev) => {
            return prev.map((existingContact) => {
                //Find the contact in the list and replace it with the hydrated one
                if (
                    existingContact.contactDetails.account.ensName === ensName
                ) {
                    return {
                        ...existingContact,
                        isHidden,
                    };
                }
                return existingContact;
            });
        });
        //update the storage
        toggleHideContactAsync(ensName, isHidden);
    };
    const _addConversation = (conversation: Conversation) => {
        const ensName = normalizeEnsName(conversation.contactEnsName);
        //Check if the contact is the user itself
        const isOwnContact = normalizeEnsName(account!.ensName) === ensName;
        //We don't want to add ourselfs
        if (isOwnContact) {
            return;
        }
        const alreadyAddedContact = contacts.find(
            (existingContact) =>
                existingContact.contactDetails.account.ensName === ensName,
        );
        //If the contact is already in the list return it
        if (alreadyAddedContact) {
            //Unhide the contact if it was hidden
            alreadyAddedContact.updatedAt = conversation.updatedAt;
            if (alreadyAddedContact.isHidden) {
                unhideContact(alreadyAddedContact);
            }
            return alreadyAddedContact;
        }

        //If the conversation already contains messages the preview message is the last message. The backend attaches that message to the conversation so we can use it here and safe a request to fetch the messages
        const previewMessage =
            conversation.previewMessage?.envelop?.message?.message;

        const newContact: ContactPreview = getEmptyContact(
            ensName,
            previewMessage,
            conversation.isHidden,
            conversation.updatedAt,
            conversation.contactProfileLocation,
        );
        //Set the new contact to the list
        _setContactsSafe([newContact]);
        //Hydrate the contact in the background
        hydrateExistingContactAsync(newContact);

        //Return the new onhydrated contact
        return newContact;
    };
    return {
        contacts,
        conversationCount,
        addConversation,
        hydrateExistingContactAsync,
        loadMoreConversations,
        initialized: conversationsInitialized,
        setSelectedContactName,
        selectedContactName,
        selectedContact,
        hideContact,
        unhideContact,
        updateConversationList,
    };
};
