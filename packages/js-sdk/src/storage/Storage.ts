import { Account, ProfileKeys } from '@dm3-org/dm3-lib-profile';
import { IBackendConnector } from '@dm3-org/dm3-lib-shared';
import {
    StorageAPI,
    StorageEnvelopContainer as StorageEnvelopContainerNew,
} from '@dm3-org/dm3-lib-storage';
import { EncryptedCloudStorage } from './EncryptedCloudStorage';

export class Storage {
    private storageApi: StorageAPI;
    constructor(
        account: Account,
        profileKeys: ProfileKeys,
        backendConnector: IBackendConnector,
    ) {
        this.storageApi = new EncryptedCloudStorage(
            backendConnector,
            account,
            profileKeys,
        ).getCloudStorage();
    }

    editMessageBatchAsync = (
        contact: string,
        batch: StorageEnvelopContainerNew[],
    ) => {
        this.storageApi.editMessageBatch(contact, batch);
    };

    storeMessageAsync = (
        contact: string,
        envelop: StorageEnvelopContainerNew,
        isHalted: boolean = false,
    ) => {
        this.storageApi.addMessage(contact, envelop, isHalted);
    };
    storeMessageBatch = async (
        contact: string,
        batch: StorageEnvelopContainerNew[],
    ) => {
        await this.storageApi.addMessageBatch(contact, batch);
    };
    getConversations = async (size: number, offset: number) => {
        return this.storageApi.getConversations(size, offset);
    };

    addConversationAsync = (
        contact: string,
        contactProfileLocation: string[],
    ) => {
        this.storageApi.addConversation(contact, contactProfileLocation);
    };
    getMessages = async (contact: string, pageSize: number, offset: number) => {
        return this.storageApi.getMessages(contact, pageSize, offset);
    };
    clearHaltedMessages = async (messageId: string, aliasName: string) => {
        return this.storageApi.clearHaltedMessages(messageId, aliasName);
    };

    getHaltedMessages = async () => {
        return this.storageApi.getHaltedMessages();
    };

    getNumberOfMessages = async (contact: string) => {
        return this.storageApi.getNumberOfMessages(contact);
    };

    toggleHideContactAsync = (contact: string, value: boolean) => {
        return this.storageApi.toggleHideConversation(contact, value);
    };
}
