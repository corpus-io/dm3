import {
    StorageEnvelopContainer as StorageEnvelopContainerNew,
    getCloudStorage,
    load,
    migrageStorage,
} from '@dm3-org/dm3-lib-storage';

import {
    EncryptedPayload,
    decrypt as _decrypt,
    encrypt as _encrypt,
    decryptAsymmetric,
    encryptAsymmetric,
} from '@dm3-org/dm3-lib-crypto';
import { Account, ProfileKeys } from '@dm3-org/dm3-lib-profile';
import { sha256, stringify } from '@dm3-org/dm3-lib-shared';
import {
    Conversation,
    StorageAPI,
} from '@dm3-org/dm3-lib-storage/dist/new/types';
import { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { TLDContext } from '../../context/TLDContext';

//Handels storage sync and offers an interface for other hooks to interact with the storage
export const useStorage = (
    account: Account | undefined,
    storageServiceUrl: string,
    storageServiceToken: string | undefined,
    profileKeys: ProfileKeys | undefined,
) => {
    const { resolveTLDtoAlias } = useContext(TLDContext);
    const [storageApi, setStorageApi] = useState<StorageAPI | undefined>(
        undefined,
    );

    const [initialized, setInitialized] = useState<boolean>(false);

    useEffect(() => {
        setInitialized(false);
        setStorageApi(undefined);
        if (!storageServiceToken) {
            return;
        }
        init();
    }, [storageServiceToken, account]);

    const init = async () => {
        const encryptSync = async (data: string) => {
            const accountNonce = sha256(account!.ensName).slice(0, 26);
            const encryptedPayload: EncryptedPayload = await _encrypt(
                profileKeys?.encryptionKeyPair?.privateKey!,
                data,
                accountNonce,
                1,
            );
            return btoa(stringify(encryptedPayload));
        };
        const decryptSync = async (data: string) => {
            const payload: EncryptedPayload = JSON.parse(
                atob(data),
            ) as EncryptedPayload;

            return await _decrypt(
                profileKeys?.encryptionKeyPair!.privateKey!,
                payload,
                1,
            );
        };
        const encryptAsync = async (data: string) => {
            const encryptedPayload: EncryptedPayload = await encryptAsymmetric(
                profileKeys?.encryptionKeyPair?.publicKey!,
                data,
            );
            return btoa(stringify(encryptedPayload));
        };
        const decryptAsync = async (data: string) => {
            const payload: EncryptedPayload = JSON.parse(
                atob(data),
            ) as EncryptedPayload;

            return await decryptAsymmetric(
                profileKeys?.encryptionKeyPair!,
                payload,
            );
        };

        const s = getCloudStorage(
            storageServiceUrl,
            storageServiceToken!,
            account!.ensName,
            {
                encryptAsync,
                decryptAsync,
                encryptSync,
                decryptSync,
            },
        );

        await migrate(s);
        setStorageApi(s);
        setInitialized(true);
    };

    const editMessageBatchAsync = (
        contact: string,
        batch: StorageEnvelopContainerNew[],
    ) => {
        if (!storageApi) {
            throw Error('Storage not initialized');
        }
        //Because the straoge cannot handle concurrency properly we need to catch the error and retry if the message is not yet synced
        storageApi.editMessageBatch(contact, batch).catch((e) => {
            console.log('message not sync yet');
        });
    };

    const storeMessageAsync = (
        contact: string,
        envelop: StorageEnvelopContainerNew,
    ) => {
        if (!storageApi) {
            throw Error('Storage not initialized');
        }
        storageApi.addMessage(contact, envelop);
    };
    const storeMessageBatch = async (
        contact: string,
        batch: StorageEnvelopContainerNew[],
    ) => {
        if (!storageApi) {
            throw Error('Storage not initialized');
        }
        await storageApi.addMessageBatch(contact, batch);
    };
    const getConversations = async (page: number) => {
        if (!storageApi) {
            return Promise.resolve([]);
        }
        return storageApi.getConversationList(page);
    };

    const addConversationAsync = (contact: string) => {
        if (!storageApi) {
            throw Error('Storage not initialized');
        }
        storageApi.addConversation(contact);
    };
    const getMessages = async (contact: string, page: number) => {
        if (!storageApi) {
            return Promise.resolve([]);
        }
        return storageApi.getMessages(contact, page);
    };

    const getNumberOfMessages = async (contact: string) => {
        if (!storageApi) {
            return Promise.resolve(0);
        }
        return storageApi.getNumberOfMessages(contact);
    };

    const toggleHideContactAsync = (contact: string, value: boolean) => {
        if (!storageApi) {
            return Promise.resolve(0);
        }
        storageApi.toggleHideConversation(contact, value);
    };

    //Migration to migrate the old storage to the new storage
    //Remove after a certain time once every user has migrated
    const migrate = async (cloudStorage: StorageAPI) => {
        const hasAlreadyMigrated = await axios.get(
            `${storageServiceUrl}/storage/new/${account?.ensName}/migrationStatus`,
            {
                headers: {
                    Authorization: `Bearer ${storageServiceToken}`,
                },
            },
        );

        //If the user has already migrated we don't need to do anything
        if (hasAlreadyMigrated.data === true) {
            //  return;
        }

        //Check if the user has used dm3 before
        const { data: legacyStorageFile } = await axios.get(
            `${storageServiceUrl}/storage/${account?.ensName}/`,
            {
                headers: {
                    Authorization: `Bearer ${storageServiceToken}`,
                },
            },
        );

        //If the user has used dm3 before we need to migrate the old storage to the new one
        if (legacyStorageFile !== null) {
            const userDb = await load(
                JSON.parse(legacyStorageFile),
                profileKeys?.storageEncryptionKey!,
            );
            await printUserDb();
            await migrageStorage(userDb, cloudStorage, resolveTLDtoAlias);
        }
        //Set the migrationStatus to true. So we won't migrate again
        await axios.post(
            `${storageServiceUrl}/storage/new/${account?.ensName}/migrationStatus`,
            undefined,
            {
                headers: {
                    Authorization: `Bearer ${storageServiceToken}`,
                },
            },
        );
    };
    const printUserDb = async () => {
        const { data: legacyStorageFile } = await axios.get(
            `${storageServiceUrl}/storage/${account?.ensName}/`,
            {
                headers: {
                    Authorization: `Bearer ${storageServiceToken}`,
                },
            },
        );
        if (legacyStorageFile === null) {
            return;
        }
        const userDb = await load(
            JSON.parse(legacyStorageFile),
            profileKeys?.storageEncryptionKey!,
        );
        userDb.conversations.forEach((value, key) => {
            console.log('key', key);
            console.log('value', value);
        });
    };

    return {
        storeMessageAsync,
        storeMessageBatch,
        editMessageBatchAsync,
        getConversations,
        addConversationAsync,
        getMessages,
        getNumberOfMessages,
        toggleHideContactAsync,
        initialized,
    };
};

export type StoreMessageAsync = (
    contact: string,
    envelop: StorageEnvelopContainerNew,
) => void;
export type editMessageBatchAsync = (
    contact: string,
    batch: StorageEnvelopContainerNew[],
) => void;
export type StoreMessageBatch = (
    contact: string,
    batch: StorageEnvelopContainerNew[],
) => Promise<void>;
export type GetConversations = (page: number) => Promise<Conversation[]>;
export type AddConversation = (contact: string) => void;
export type GetMessages = (
    contact: string,
    page: number,
) => Promise<StorageEnvelopContainerNew[]>;
export type GetNumberOfMessages = (contact: string) => Promise<number>;
export type ToggleHideContactAsync = (contact: string, value: boolean) => void;
