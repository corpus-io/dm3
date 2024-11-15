import { Account, PrismaClient } from '@prisma/client';
import Storage from './storage';
import { ConversationRecord } from './storage/postgres/dto/ConversationRecord';
import { MessageRecord } from './storage/postgres/dto/MessageRecord';
import { IAccountDatabase } from '@dm3-org/dm3-lib-server-side';

export async function getPrismaClient() {
    return new PrismaClient();
}

export async function getDatabase(
    _prisma?: PrismaClient,
): Promise<IBackendDatabase> {
    const prisma = _prisma ?? (await getPrismaClient());

    return {
        //Account
        setAccount: Storage.setAccount(prisma),
        getAccount: Storage.getAccount(prisma),
        hasAccount: Storage.hasAccount(prisma),
        //AddConversation
        addConversation: Storage.addConversation(prisma),
        getConversationList: Storage.getConversationList(prisma),
        //Add Messages
        addMessageBatch: Storage.addMessageBatch(prisma),
        //Get Messages
        getMessagesFromStorage: Storage.getMessages(prisma),
        //Edit Message Batch
        editMessageBatch: Storage.editMessageBatch(prisma),
        //Get Number Of Messages
        getNumberOfMessages: Storage.getNumberOfMessages(prisma),
        //Get Number Of Converations
        getNumberOfConverations: Storage.getNumberOfConversations(prisma),
        //Toggle Hide Conversation
        toggleHideConversation: Storage.toggleHideConversation(prisma),
        //Get Halted Messages
        getHaltedMessages: Storage.getHaltedMessages(prisma),
        //Delete Halted Message
        clearHaltedMessage: Storage.clearHaltedMessage(prisma),
    };
}

export interface IBackendDatabase extends IAccountDatabase {
    setAccount: (ensName: string) => Promise<Account>;
    getAccount: (ensName: string) => Promise<Account | null>;
    hasAccount: (ensName: string) => Promise<boolean>;

    addConversation: (
        ensName: string,
        encryptedContactName: string,
        encryptedProfileLocation: string,
    ) => Promise<boolean>;
    getConversationList: (
        ensName: string,
        size: number,
        offset: number,
    ) => Promise<ConversationRecord[]>;
    addMessageBatch: (
        ensName: string,
        encryptedContactName: string,
        messageBatch: MessageRecord[],
    ) => Promise<boolean>;
    getMessagesFromStorage: (
        ensName: string,
        encryptedContactName: string,
        size: number,
        offset: number,
    ) => Promise<string[]>;
    editMessageBatch: (
        ensName: string,
        encryptedContactName: string,
        messageBatch: MessageRecord[],
    ) => Promise<void>;
    getNumberOfMessages: (
        ensName: string,
        encryptedContactName: string,
    ) => Promise<number>;
    getNumberOfConverations: (ensName: string) => Promise<number>;
    toggleHideConversation: (
        ensName: string,
        encryptedContactName: string,
        isHidden: boolean,
    ) => Promise<boolean>;
    getHaltedMessages: (ensName: string) => Promise<MessageRecord[]>;
    clearHaltedMessage: (
        ensName: string,
        aliasName: string,
        messageId: string,
    ) => Promise<boolean>;
}
