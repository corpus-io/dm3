import { encryptAsymmetric } from '@dm3-org/dm3-lib-crypto';
import {
    EncryptionEnvelop,
    Envelop,
    Message,
    MessageState,
    buildEnvelop,
} from '@dm3-org/dm3-lib-messaging';
import { normalizeEnsName } from '@dm3-org/dm3-lib-profile';
import { sha256, stringify } from '@dm3-org/dm3-lib-shared';
import { StorageEnvelopContainer as StorageEnvelopContainerNew } from '@dm3-org/dm3-lib-storage';
import { useCallback, useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { ConversationContext } from '../../context/ConversationContext';
import { DeliveryServiceContext } from '../../context/DeliveryServiceContext';
import { StorageContext } from '../../context/StorageContext';
import { TLDContext } from '../../context/TLDContext';
import { ContactPreview } from '../../interfaces/utils';
import { submitEnvelopsToReceiversDs } from '../../utils/deliveryService/submitEnvelopsToReceiversDs';
import { useHaltDelivery } from '../haltDelivery/useHaltDelivery';
import { useMainnetProvider } from '../mainnetprovider/useMainnetProvider';
import { ReceiptDispatcher } from './receipt/ReceiptDispatcher';
import { renderMessage } from './renderer/renderMessage';
import { checkIfEnvelopAreInSizeLimit } from './sizeLimit/checkIfEnvelopIsInSizeLimit';
import { handleMessagesFromDeliveryService } from './sources/handleMessagesFromDeliveryService';
import { handleMessagesFromStorage } from './sources/handleMessagesFromStorage';
import { handleMessagesFromWebSocket } from './sources/handleMessagesFromWebSocket';

const DEFAULT_MESSAGE_PAGESIZE = 100;

export enum MessageIndicator {
    SENT = 'SENT',
    RECEIVED = 'RECEIVED',
    READED = 'READED',
}

//Message source to identify where a message comes from. This is important to handle pagination of storage messages properly
export enum MessageSource {
    //Messages added by the client via addMessage
    Client,
    //Messages fetched from the storage
    Storage,
    //Messages fetched from the deliveryService
    DeliveryService,
    //Messages received from the Websocket
    WebSocket,
}

export type MessageModel = StorageEnvelopContainerNew & {
    reactions: Envelop[];
    replyToMessageEnvelop?: Envelop;
    source: MessageSource;
    indicator?: MessageIndicator;
};

export type MessageStorage = {
    [contact: string]: MessageModel[];
};

export const useMessage = () => {
    const {
        contacts,
        initialized: conversationsInitialized,
        selectedContact,
        addConversation,
        updateConversationList,
        hydrateExistingContactAsync,
    } = useContext(ConversationContext);
    const { account, profileKeys } = useContext(AuthContext);
    const {
        fetchIncomingMessages,
        syncAcknowledgement,
        isInitialized: deliveryServiceInitialized,
    } = useContext(DeliveryServiceContext);

    const { onNewMessage, removeOnNewMessageListener } = useContext(
        DeliveryServiceContext,
    );

    const {
        getMessages: getMessagesFromStorage,
        storeMessage,
        storeMessageBatch,
        editMessageBatchAsync,
        initialized: storageInitialized,
    } = useContext(StorageContext);

    //load halt delivery here to be able to store messages as halted
    useHaltDelivery();

    const [messages, setMessages] = useState<MessageStorage>({});

    const [contactsLoading, setContactsLoading] = useState<string[]>([]);

    //Effect to listen for new contacts and add them to the message state
    useEffect(() => {
        //Find new contacts
        const newContacts = contacts.filter(
            (contact) => !messages[contact.contactDetails.account.ensName],
        );

        newContacts.forEach((contact) => {
            addNewContact(contact.contactDetails.account.ensName);
        });
    }, [contacts]);

    useEffect(() => {
        if (
            !account ||
            !storageInitialized ||
            !deliveryServiceInitialized ||
            !conversationsInitialized
        )
            return;
        const getMessagesFromDs = async () => {
            const messagesFromDs = await handleMessagesFromDeliveryService(
                selectedContact,
                account!,
                profileKeys!,
                addConversation,
                storeMessageBatch,
                fetchIncomingMessages,
                syncAcknowledgement,
                updateConversationList,
                addMessage,
            );
            await Promise.all(
                messagesFromDs.map(async (conversation) => {
                    _addMessages(conversation.aliasName, conversation.messages);
                }),
            );
        };
        getMessagesFromDs();
    }, [
        storageInitialized,
        account,
        deliveryServiceInitialized,
        conversationsInitialized,
    ]);

    //Effect to reset the messages when the storage is initialized, i.e on account change
    useEffect(() => {
        setMessages({});
        setContactsLoading([]);
    }, [storageInitialized, account]);

    //Effect to handle new message emited from the websocket
    useEffect(() => {
        onNewMessage((encryptedEnvelop: EncryptionEnvelop) => {
            handleMessagesFromWebSocket(
                addConversation,
                setMessages,
                storeMessage,
                profileKeys!,
                selectedContact!,
                encryptedEnvelop,
                new ReceiptDispatcher(account!, profileKeys!, addMessage),
                updateConversationList,
            );
        });

        return () => {
            console.log('remove on new message listener');
            removeOnNewMessageListener();
        };
    }, [onNewMessage, selectedContact, contacts]);

    //Mark messages as read when the selected contact changes
    useEffect(() => {
        const markMsgsAsRead = async () => {
            const _contact = selectedContact?.contactDetails.account.ensName;
            if (!_contact) {
                return;
            }

            const contact = normalizeEnsName(_contact);

            const unreadMessages = (messages[contact] ?? []).filter(
                (message) =>
                    message.messageState !== MessageState.Read &&
                    message.envelop.message.metadata.from !== account?.ensName,
            );

            setMessages((prev) => {
                //Check no new messages are added here
                return {
                    ...prev,
                    [contact]: [
                        ...(prev[contact] ?? []).map((message) => ({
                            ...message,
                            messageState: MessageState.Read,
                        })),
                    ],
                };
            });

            //For every read message we sent a READ_OPENED acknowledgement to sender using acknowledgementManager
            const receiptDispatcher = new ReceiptDispatcher(
                account!,
                profileKeys!,
                addMessage,
            );

            await receiptDispatcher.sendMultiple(
                selectedContact,
                contact,
                unreadMessages,
            );

            editMessageBatchAsync(
                contact,
                unreadMessages.map((message) => ({
                    ...message,
                    messageState: MessageState.Read,
                })),
            );
        };
        markMsgsAsRead();
    }, [selectedContact]);

    //View function that returns wether a contact is loading
    const contactIsLoading = useCallback(
        (_contactName?: string) => {
            if (!_contactName) {
                return false;
            }
            const contact = normalizeEnsName(_contactName);
            return contactsLoading.includes(contact);
        },
        [contactsLoading],
    );
    //View function that returns the messages for a contact
    const getMessages = useCallback(
        (_contactName: string) => {
            const contactName = normalizeEnsName(_contactName);
            return renderMessage(messages[contactName] ?? []);
        },
        [messages],
    );
    //View function that returns the number of unread messages for a contact
    const getUnreadMessageCount = useCallback(
        (_contactName: string) => {
            const contactName = normalizeEnsName(_contactName);
            if (!messages[contactName]) {
                return 0;
            }
            return messages[contactName].filter(
                (message) =>
                    message.messageState !== MessageState.Read &&
                    message.envelop.message.metadata.type !== 'READ_OPENED' &&
                    message.envelop.message.metadata.type !== 'READ_RECEIVED' &&
                    message.envelop.message.metadata.from !== account?.ensName,
            ).length;
        },
        [messages],
    );
    //When a new contact is added we load the initial messages
    const addNewContact = (_contactName: string) => {
        const contact = normalizeEnsName(_contactName);
        //Contact already exists
        if (messages[contact]) {
            return;
        }
        setMessages((prev) => {
            //Check no new messages are added here
            return {
                ...prev,
                [contact]: [],
            };
        });
        loadInitialMessages(contact);
    };

    const addMessage = async (
        _contactName: string,
        message: Message,
    ): Promise<{ isSuccess: boolean; error?: string }> => {
        const contact = normalizeEnsName(_contactName);
        //Find the recipient of the message in the contact list
        const recipient = contacts.find(
            (c) => c.contactDetails.account.ensName === contact,
        );
        /**
         * Check if the recipient has a PublicEncrptionKey
         * if not only keep the msg at the senders storage
         */
        const recipientIsDm3User =
            !!recipient?.contactDetails.account.profile?.publicEncryptionKey;

        //If the recipient is a dm3 user we can send the message to the delivery service
        if (recipientIsDm3User) {
            return await _dispatchMessage(contact, recipient, message);
        }

        //There are cases were a messages is already to be send even though the contract hydration is not finished yet.
        //This happens if a message has been picked up from the delivery service and the clients sends READ_RECEIVE or READ_OPENED acknowledgements
        //In that case we've to check again to the if the user is a DM3 user, before we decide to keep the message
        const potentialReceiver = contacts.find(
            (c) => c.contactDetails.account.ensName === contact,
        );

        //This should normally not happen, since the contact should be already in the contact list
        if (!potentialReceiver) {
            return await haltMessage(contact, message);
        }
        const hydratedC = await hydrateExistingContactAsync(potentialReceiver);

        //If the user is a DM3 user we can send the message to the delivery service
        if (hydratedC.contactDetails.account.profile?.publicEncryptionKey) {
            return await _dispatchMessage(contact, hydratedC, message);
        }

        //If neither the recipient nor the potential recipient is a DM3 user we store the message in the storage
        return await haltMessage(contact, message);
    };

    const haltMessage = async (contact: string, message: Message) => {
        //StorageEnvelopContainerNew to store the message in the storage
        const messageModel: MessageModel = {
            envelop: {
                message,
                metadata: {
                    encryptionScheme: 'x25519-chacha20-poly1305',
                    //since we don't have a recipient we can't encrypt the deliveryInformation
                    deliveryInformation: '',
                    //Because storing a message is always an internal process we dont need to sign it. The signature is only needed for the delivery service
                    signature: '',
                    messageHash: sha256(stringify(message)),
                    version: 'v1',
                },
            },
            messageState: MessageState.Created,
            source: MessageSource.Client,
            reactions: [],
        };
        setMessages((prev) => {
            //Check message has been added previously
            return {
                ...prev,
                [contact]: [...(prev[contact] ?? []), messageModel],
            };
        });
        //Store the message and mark it as halted
        storeMessage(contact, messageModel, true);
        return { isSuccess: true };
    };

    //Just for testing purposes
    //TODO cleanup and find better solution
    const isLuksoName = (input: string): boolean => {
        const regex = /^[a-zA-Z0-9]+#[a-zA-Z0-9]{4}\.up$/;
        return regex.test(input);
    };

    const _dispatchMessage = async (
        contact: string,
        recipient: ContactPreview,
        message: Message,
    ) => {
        //Build the envelops based on the message and the users profileKeys.
        //For each deliveryServiceProfile a envelop is created that will be sent to the delivery service
        const envelops = await Promise.all(
            recipient.contactDetails.deliveryServiceProfiles.map(
                async (deliverServiceProfile) => {
                    return await buildEnvelop(
                        message,
                        (publicKey: string, msg: string) =>
                            encryptAsymmetric(publicKey, msg),
                        {
                            from: account!,
                            to: {
                                ...recipient!.contactDetails.account,
                                //Cover edge case of lukso names. TODO discuss with the team and decide how to dela with non ENS names
                                ensName: isLuksoName(recipient.name)
                                    ? recipient.contactDetails.account.ensName
                                    : recipient.name,
                            },
                            deliverServiceProfile,
                            keys: profileKeys!,
                        },
                    );
                },
            ),
        );

        // check if message size in within delivery service message size limit
        const isMsgInSizeLimit = await checkIfEnvelopAreInSizeLimit(
            //Find the biggest envelop
            envelops.map((e) => e.encryptedEnvelop),
            recipient.messageSizeLimit,
        );

        // If message size is larger than limit, return with error
        if (!isMsgInSizeLimit) {
            return {
                isSuccess: false,
                error: 'The size of the message is larger than limit '
                    .concat(recipient.messageSizeLimit.toString(), ' bytes. ')
                    .concat('Please reduce the message size.'),
            };
        }

        //StorageEnvelopContainerNew to store the message in the storage
        const messageStorageContainer = {
            //On the senders end we store only the first envelop
            envelop: envelops[0].envelop,
            messageState: MessageState.Created,
            reactions: [],
            //Message has just been created by the client
            source: MessageSource.Client,
        };

        //Add the message to the state
        setMessages((prev) => {
            return {
                ...prev,
                [contact]: [...(prev[contact] ?? []), messageStorageContainer],
            };
        });

        //Storage the message in the storage
        storeMessage(contact, messageStorageContainer);

        // TODO send to receivers DS
        // When we have a recipient we can send the message using the socket connection

        //TODO either store msg in cache when sending or wait for the response from the delivery service¿
        const recipientDs = recipient.contactDetails.deliveryServiceProfiles;

        if (!recipientDs) {
            //TODO storage msg in storage
            return {
                isSuccess: false,
                error: 'Recipient has no delivery service profile',
            };
        }
        //Send the envelops to the delivery service
        await submitEnvelopsToReceiversDs(envelops);
        return { isSuccess: true };
    };

    const loadInitialMessages = async (_contactName: string) => {
        const contactName = normalizeEnsName(_contactName);
        const initialMessages = await Promise.all([
            handleMessagesFromStorage(
                setContactsLoading,
                getMessagesFromStorage,
                contactName,
                DEFAULT_MESSAGE_PAGESIZE,
                //For the first page we use 0 as offset
                0,
            ),
        ]);
        const flatten = initialMessages.reduce(
            (acc, val) => acc.concat(val),
            [],
        );

        console.log('load initial messages for contact', contactName);
        await _addMessages(contactName, flatten);
    };

    const loadMoreMessages = async (_contactName: string): Promise<number> => {
        const contactName = normalizeEnsName(_contactName);

        const messagesFromContact = messages[contactName] ?? [];
        //For the messageCount we only consider messages from the MessageSource storage
        const messageCount = messagesFromContact.filter(
            (message) => message.source === MessageSource.Storage,
        ).length;

        //We dont need to fetch more messages if the previously fetched page is smaller than the default pagesize
        const isLastPage = messageCount % DEFAULT_MESSAGE_PAGESIZE !== 0;
        if (isLastPage) {
            //No more messages have been added
            return 0;
        }

        //We calculate the offset based on the messageCount
        const offset = Math.floor(messageCount / DEFAULT_MESSAGE_PAGESIZE);
        console.log('load more ', messageCount, offset);

        const messagesFromStorage = await handleMessagesFromStorage(
            setContactsLoading,
            getMessagesFromStorage,
            contactName,
            DEFAULT_MESSAGE_PAGESIZE,
            offset,
        );
        return await _addMessages(contactName, messagesFromStorage);
    };

    const _addMessages = async (
        _contactName: string,
        newMessages: MessageModel[],
    ) => {
        const contactName = normalizeEnsName(_contactName);

        newMessages
            //filter duplicates
            .filter((message, index, self) => {
                if (!message.envelop.metadata?.messageHash) {
                    return true;
                }
                return (
                    index ===
                    self.findIndex(
                        (m) =>
                            m.envelop.metadata?.messageHash ===
                            message.envelop.metadata?.messageHash,
                    )
                );
            });

        const withResolvedAliasNames = await resolveAliasNames(newMessages);

        setMessages((prev) => {
            return {
                ...prev,
                [contactName]: [
                    ...(prev[contactName] ?? []),
                    ...withResolvedAliasNames,
                ],
            };
        });

        setContactsLoading((prev) => {
            return prev.filter((contact) => contact !== contactName);
        });

        // the count of new messages added
        return withResolvedAliasNames.length;
    };

    /**
     * Some messages from the old storage might not have the alias resolved yet.
     * We need to fetch them so they are not appearing as our own messages.
     */
    const resolveAliasNames = async (messages: MessageModel[]) => {
        return await Promise.all(
            messages.map(async (message) => {
                return {
                    ...message,
                    envelop: {
                        ...message.envelop,
                        message: {
                            ...message.envelop.message,
                            metadata: {
                                ...message.envelop.message.metadata,
                                from: normalizeEnsName(
                                    message.envelop.message.metadata?.from ??
                                        '',
                                ),
                            },
                        },
                    },
                };
            }),
        );
    };

    return {
        messages,
        getUnreadMessageCount,
        getMessages,
        addMessage,
        loadMoreMessages,
        contactIsLoading,
    };
};

export type GetMessages = (contact: string) => MessageModel[];
export type AddMessage = (
    contact: string,
    message: Message,
) => Promise<{ isSuccess: boolean; error?: string }>;
export type ContactLoading = (contact: string) => boolean;
