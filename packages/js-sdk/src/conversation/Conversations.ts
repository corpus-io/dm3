/* eslint-disable max-len */
import {
    Account,
    DeliveryServiceProfile,
    normalizeEnsName,
} from '@dm3-org/dm3-lib-profile';
import { Conversation, StorageAPI } from '@dm3-org/dm3-lib-storage';
import { ContactPreview, getEmptyContact } from './types';
import { Tld } from '../tld/Tld';
import { hydrateContract as hydrateContact } from './hydrate/hydrateContact';
import { ethers } from 'ethers';

export class Conversations {
    private readonly provider: ethers.providers.JsonRpcProvider;
    private readonly storageApi: StorageAPI;
    private readonly tld: Tld;
    private readonly addressEnsSubdomain: string;
    private readonly account: Account;

    public conversations: ContactPreview[];

    constructor(
        storageApi: StorageAPI,
        tld: Tld,
        mainnetProvider: ethers.providers.JsonRpcProvider,
        account: Account,
        addressEnsSubdomain: string,
    ) {
        this.storageApi = storageApi;
        this.tld = tld;
        this.account = account;
        this.provider = mainnetProvider;
        this.addressEnsSubdomain = addressEnsSubdomain;
        this.conversations = [];
    }

    public async addConversation(_ensName: string) {
        const contactTldName = normalizeEnsName(_ensName);

        const aliasName = await this.tld.resolveTLDtoAlias(contactTldName);
        const newConversation: Conversation = {
            contactEnsName: aliasName,
            contactProfileLocation: [contactTldName], //(ID)
            isHidden: false,
            previewMessage: undefined,
            updatedAt: new Date().getTime(),
        };
        const conversationPreview = this._addConversation(newConversation);
        //Add the contact to the storage in the background
        this.storageApi.addConversation(aliasName, [contactTldName]);
        return conversationPreview;
    }

    private async _addConversation(conversation: Conversation) {
        const ensName = normalizeEnsName(conversation.contactEnsName);
        //Check if the contact is the user itself
        const isOwnContact =
            normalizeEnsName(this.account!.ensName) === ensName;
        //We don't want to add ourselfs
        if (isOwnContact) {
            return;
        }
        const alreadyAddedContact = this.conversations.find(
            (existingContact) =>
                existingContact.contactDetails.account.ensName === ensName,
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

        const newContact: ContactPreview = getEmptyContact(
            ensName,
            previewMessage,
            conversation.isHidden,
            conversation.updatedAt,
            conversation.contactProfileLocation,
        );
        //Set the new contact to the list
        this._setContactsSafe([newContact]);

        const hydratedContact = await hydrateContact(
            this.provider,
            conversation,
            this.tld.resolveTLDtoAlias,
            this.addressEnsSubdomain,
        );

        this.conversations.push(hydratedContact);

        //Return the new onhydrated contact
        return newContact;
    }

    public hydrateExistingContactAsync = async (contact: ContactPreview) => {
        const conversation: Conversation = {
            contactEnsName: contact.contactDetails.account.ensName,
            contactProfileLocation: contact.contactProfileLocation,
            previewMessage: undefined,
            isHidden: contact.isHidden,
            updatedAt: contact.updatedAt,
        };
        const hydratedContact = await hydrateContact(
            this.provider,
            conversation,
            this.tld.resolveTLDtoAlias,
            this.addressEnsSubdomain,
        );
        this.conversations.push(hydratedContact);

        return hydratedContact;
    };

    private _setContactsSafe(newContacts: ContactPreview[]) {
        //Dont add duplicates
        const uniqueContacts = newContacts.filter(
            (newContact) =>
                !this.conversations.some(
                    (existingContact) =>
                        existingContact.contactDetails.account.ensName ===
                        newContact.contactDetails.account.ensName,
                ),
        );
        this.conversations = [...this.conversations, ...uniqueContacts];
    }
}
