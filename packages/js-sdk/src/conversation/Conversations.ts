/* eslint-disable max-len */
import {
    Account,
    normalizeEnsName,
    ProfileKeys,
} from '@dm3-org/dm3-lib-profile';
import {
    Conversation as ConversationDto,
    StorageAPI,
} from '@dm3-org/dm3-lib-storage';
import { ethers } from 'ethers';
import { ITLDResolver } from '../tld/nameService/ITLDResolver';
import { hydrateContract as hydrateContact } from './hydrate/hydrateContact';
import { Contact, Conversation, getEmptyContact } from './types';
import { Messages } from '../message/Messages';

export class Conversations {
    private readonly provider: ethers.providers.JsonRpcProvider;
    private readonly storageApi: StorageAPI;
    private readonly tld: ITLDResolver;
    private readonly addressEnsSubdomain: string;
    private readonly account: Account;
    private readonly profileKeys: ProfileKeys;
    public list: Conversation[];
    private callback: (event: string, eventData: any) => void;

    constructor(
        storageApi: StorageAPI,
        tld: ITLDResolver,
        mainnetProvider: ethers.providers.JsonRpcProvider,
        account: Account,
        profileKeys: ProfileKeys,
        addressEnsSubdomain: string,
        callback: (event: string, eventData: any) => void,
    ) {
        this.storageApi = storageApi;
        this.tld = tld;
        this.account = account;
        this.provider = mainnetProvider;
        this.addressEnsSubdomain = addressEnsSubdomain;
        this.profileKeys = profileKeys;
        this.list = [];
        this.callback = callback;
    }

    public async _init() {
        const conversations = await this.storageApi.getConversations(10, 0);
        await Promise.all(
            conversations.map((conversation) =>
                this._addConversation(conversation),
            ),
        );
        console.log('tinit done');
    }

    public async addConversation(_ensName: string) {
        this.callback('start_add_conversation', { ensName: _ensName });
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
        this.callback('finalise_add_conversation', { ensName: _ensName });
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
            messages: new Messages(
                this.storageApi,
                this,
                this.account,
                this.profileKeys,
                newContact,
            ),
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
            messages: new Messages(
                this.storageApi,
                this,
                this.account,
                this.profileKeys,
                hydratedContact,
            ),
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
            messages: new Messages(
                this.storageApi,
                this,
                this.account,
                this.profileKeys,
                hydratedContact,
            ),
            contact: hydratedContact,
        };
        this.list.push(hydratedConversation);
        this.callback('add_message', { ensName: contact.account.ensName });
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
