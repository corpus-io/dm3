import {
    DeliveryServiceProperties,
    IGlobalNotification,
    IOtp,
    type Account as AccountType,
} from '@dm3-org/dm3-lib-delivery';
import { EncryptionEnvelop } from '@dm3-org/dm3-lib-messaging';
import { IAccountDatabase } from '@dm3-org/dm3-lib-server-side';
import {
    NotificationChannel,
    NotificationChannelType,
} from '@dm3-org/dm3-lib-shared';
import { createClient } from 'redis';
import Account from './account';
import { getIdEnsName } from './getIdEnsName';
import Messages from './messages';
import { syncAcknowledge } from './messages/syncAcknowledge';
import type { IntervalMetric } from './metrics';
import Metrics from './metrics';
import Notification from './notification';
import Otp from './otp';

export enum RedisPrefix {
    Conversation = 'conversation:',
    IncomingConversations = 'incoming.conversations:',
    Sync = 'sync:',
    // Account used to be called Session. The prefix still resolves to "session:" for now.
    Account = 'session:',
    NotificationChannel = 'notificationChannel:',
    GlobalNotification = 'globalNotification:',
    Otp = 'otp:',
    MetricsMessageCount = 'metricsMessageCount:',
    MetricsMessageSize = 'metricsMessageSize:',
    MetricsNotificationCount = 'metricsNotificationCount:',
}

export async function getRedisClient() {
    const url = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
    const socketConf = {
        socket: {
            tls: true,
            rejectUnauthorized: false,
        },
    };
    const client = createClient(
        process.env.NODE_ENV === 'production'
            ? {
                  url,
                  ...socketConf,
              }
            : { url },
    );

    client.on('error', (err) => {
        console.error('Redis error: ' + (err as Error).message);
    });

    client.on('reconnecting', () => console.info('Redis reconnection'));
    client.on('ready', () => console.info('Redis ready'));

    await client.connect();

    return client;
}

export async function getDatabase(_redis?: Redis): Promise<IDatabase> {
    const redis = _redis ?? (await getRedisClient());

    return {
        //Messages
        getIncomingMessages: Messages.getIncomingMessages(redis),
        getMessages: Messages.getMessages(redis),
        createMessage: Messages.createMessage(redis),
        deleteExpiredMessages: Messages.deleteExpiredMessages(redis),
        // Account
        setAccount: Account.setAccount(redis),
        getAccount: Account.getAccount(redis),
        hasAccount: Account.hasAccount(redis),
        getIdEnsName: getIdEnsName(redis),
        syncAcknowledge: syncAcknowledge(redis),
        //Notification
        getUsersNotificationChannels:
            Notification.getUsersNotificationChannels(redis),
        addUsersNotificationChannel:
            Notification.addUsersNotificationChannel(redis),
        setNotificationChannelAsVerified:
            Notification.setNotificationChannelAsVerified(redis),
        enableOrDisableNotificationChannel:
            Notification.enableOrDisableNotificationChannel(redis),
        removeNotificationChannel:
            Notification.removeNotificationChannel(redis),
        // Global Notification
        getGlobalNotification: Notification.getGlobalNotification(redis),
        setGlobalNotification: Notification.setGlobalNotification(redis),
        // Verification Otp for Email, Mobile, etc..
        setOtp: Otp.setOtp(redis),
        getOtp: Otp.getOtp(redis),
        resetOtp: Otp.resetOtp(redis),
        // Metrics
        getMetrics: Metrics.getMetrics(redis),
        countMessage: Metrics.countMessage(redis),
        countNotification: Metrics.countNotification(redis),
    };
}

export interface IDatabase extends IAccountDatabase {
    setAccount: (address: string, account: AccountType) => Promise<void>;
    getAccount: (address: string) => Promise<AccountType | null>;
    //TODO use address
    getIncomingMessages: (
        address: string,
        limit: number,
    ) => Promise<EncryptionEnvelop[]>;
    getMessages: (
        conversionId: string,
        offset: number,
        limit: number,
    ) => Promise<EncryptionEnvelop[]>;
    createMessage: (
        receiverAddress: string,
        conversationId: string,
        envelop: EncryptionEnvelop,
    ) => Promise<void>;
    deleteExpiredMessages: (time: number) => Promise<void>;
    getIdEnsName: (ensName: string) => Promise<string>;
    syncAcknowledge: (
        conversationId: string,
        messageHash: string,
    ) => Promise<boolean>;
    getUsersNotificationChannels: (
        ensName: string,
    ) => Promise<NotificationChannel[]>;
    addUsersNotificationChannel: (
        ensName: string,
        channel: NotificationChannel,
    ) => Promise<void>;
    setNotificationChannelAsVerified: (
        ensName: string,
        channel: NotificationChannelType,
    ) => Promise<void>;
    enableOrDisableNotificationChannel: (
        ensName: string,
        channel: NotificationChannelType,
        isEnabled: boolean,
    ) => Promise<void>;
    removeNotificationChannel: (
        ensName: string,
        channel: NotificationChannelType,
    ) => Promise<void>;
    getGlobalNotification: (ensName: string) => Promise<IGlobalNotification>;
    setGlobalNotification: (
        ensName: string,
        isEnabled: boolean,
    ) => Promise<void>;
    setOtp: (
        ensName: string,
        otp: string,
        channelType: NotificationChannelType,
        generatedAt: Date,
    ) => Promise<void>;
    getOtp: (
        ensName: string,
        channelType: NotificationChannelType,
    ) => Promise<IOtp | null>;
    resetOtp: (
        ensName: string,
        channelType: NotificationChannelType,
    ) => Promise<void>;
    getMetrics: (
        deliveryServiceProperties: DeliveryServiceProperties,
    ) => Promise<IntervalMetric[]>;
    countMessage: (
        messageSizeBytes: number,
        deliveryServiceProperties: DeliveryServiceProperties,
    ) => Promise<void>;
    countNotification: (
        deliveryServiceProperties: DeliveryServiceProperties,
    ) => Promise<void>;
}

export type Redis = Awaited<ReturnType<typeof getRedisClient>>;
