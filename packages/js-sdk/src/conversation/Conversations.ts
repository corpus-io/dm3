/* eslint-disable max-len */
import { Account, normalizeEnsName } from '@dm3-org/dm3-lib-profile';
import {
    Conversation as ConversationDto,
    StorageAPI,
} from '@dm3-org/dm3-lib-storage';
import { ethers } from 'ethers';
import { ITLDResolver } from '../tld/nameService/ITLDResolver';
import { hydrateContract as hydrateContact } from './hydrate/hydrateContact';
import { Contact, Conversation, getEmptyContact } from './types';

export class Conversations {
    private readonly provider: ethers.providers.JsonRpcProvider;
    private readonly storageApi: StorageAPI;
    private readonly tld: ITLDResolver;
    private readonly addressEnsSubdomain: string;
    private readonly account: Account;

    public list: Conversation[];

    constructor(
        storageApi: StorageAPI,
        tld: ITLDResolver,
        mainnetProvider: ethers.providers.JsonRpcProvider,
        account: Account,
        addressEnsSubdomain: string,
    ) {
        this.storageApi = storageApi;
        this.tld = tld;
        this.account = account;
        this.provider = mainnetProvider;
        this.addressEnsSubdomain = addressEnsSubdomain;
        this.list = [];
    }

    public async addConversation(_ensName: string) {
        const contactTldName = normalizeEnsName(_ensName);

        const aliasName = await this.tld.resolveTLDtoAlias(contactTldName);
        const newConversation: ConversationDto = {
            contactEnsName: aliasName,
            contactProfileLocation: [contactTldName],
            isHidden: false,
            updatedAt: new Date().getTime(),
            previewMessage: undefined,
        };

        const conversationPreview = this._addConversation(newConversation);
        //Add the contact to the storage in the background
        this.storageApi.addConversation(aliasName, [contactTldName]);
        return conversationPreview;
    }

    private async _addConversation(conversation: ConversationDto) {
        const ensName = normalizeEnsName(conversation.contactEnsName);
        //Check if the contact is the user itself
        const isOwnContact =
            normalizeEnsName(this.account!.ensName) === ensName;
        //We don't want to add ourselfs
        if (isOwnContact) {
            return;
        }
        const alreadyAddedContact = this.list.find(
            (existingContact) =>
                existingContact.contact.account.ensName === ensName,
        );
        //If the contact is already in the list return it
        if (alreadyAddedContact) {
            //Unhide the contact if it was hidden
            // alreadyAddedContact.updatedAt = conversation.updatedAt;
            // if (alreadyAddedContact.isHidden) {
            //     unhideContact(alreadyAddedContact);
            // }
            // return alreadyAddedContact;
        }

        //If the conversation already contains messages the preview message is the last message. The backend attaches that message to the conversation so we can use it here and safe a request to fetch the messages
        const previewMessage =
            conversation.previewMessage?.envelop?.message?.message;

        const newContact: Contact = getEmptyContact(
            ensName,
            previewMessage,
            conversation.isHidden,
            conversation.updatedAt,
            conversation.contactProfileLocation,
        );

        const newConversation: Conversation = {
            //TODO change that once Message class has been implemented
            messages: undefined as any,
            contact: newContact,
        };
        //Set the new contact to the list
        this._setContactsSafe([newConversation]);

        const hydratedContact = await hydrateContact(
            this.provider,
            conversation,
            this.tld.resolveAliasToTLD,
            this.addressEnsSubdomain,
        );

        const hydratedConversation: Conversation = {
            messages: undefined as any,
            contact: hydratedContact,
        };
        //find existing contact and replace it with the hydrated one
        this.list = this.list.map((existingContact) => {
            if (existingContact.contact.account.ensName === ensName) {
                return hydratedConversation;
            }
            return existingContact;
        });
        //Return the new onhydrated contact
        return hydratedConversation;
    }

    public hydrateExistingContactAsync = async (contact: Contact) => {
        const conversation: ConversationDto = {
            contactEnsName: contact.account.ensName,
            contactProfileLocation: contact.contactProfileLocation,
            previewMessage: undefined,
            isHidden: contact.isHidden,
            updatedAt: contact.updatedAt,
        };
        const hydratedContact = await hydrateContact(
            this.provider,
            conversation,
            this.tld.resolveAliasToTLD,
            this.addressEnsSubdomain,
        );
        const hydratedConversation: Conversation = {
            messages: undefined as any,
            contact: hydratedContact,
        };
        this.list.push(hydratedConversation);

        return hydratedConversation;
    };

    private _setContactsSafe(newConversations: Conversation[]) {
        //Dont add duplicates
        const uniqueContacts = newConversations.filter(
            (newContact) =>
                !this.list.some(
                    (existingContact) =>
                        existingContact.contact.account.ensName ===
                        newContact.contact.account.ensName,
                ),
        );
        this.list = [...this.list, ...uniqueContacts];
    }
}
