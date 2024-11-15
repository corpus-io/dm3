import { IDatabase, Redis, getDatabase, getRedisClient } from '../getDatabase';
import {
    NotificationChannelType,
    NotificationChannel,
} from '@dm3-org/dm3-lib-shared';

const USER_ADDRESS = '0x25A643B6e52864d0eD816F1E43c0CF49C83B8292';

describe('Set users EMAIL notification channel as verified', () => {
    let redisClient: Redis;
    let db: IDatabase;

    beforeEach(async () => {
        redisClient = await getRedisClient();
        db = await getDatabase(redisClient);
        await redisClient.flushDb();
    });

    afterEach(async () => {
        await redisClient.flushDb();
        await redisClient.disconnect();
    });

    it('Fail to verify as notification channel is not configured ', async () => {
        try {
            await db.setNotificationChannelAsVerified(
                USER_ADDRESS,
                NotificationChannelType.EMAIL,
            );
        } catch (error) {
            expect(error.message).toBe(
                'Notification channel EMAIL is not configured',
            );
        }
    });

    it('Verifies EMAIL notification channel', async () => {
        const notificationChannel: NotificationChannel = {
            type: NotificationChannelType.EMAIL,
            config: {
                recipientValue: 'foo@bar.de',
            },
        };

        // add EMAIL notification channel
        await db.addUsersNotificationChannel(USER_ADDRESS, notificationChannel);

        // set EMAIL channel as verified
        await db.setNotificationChannelAsVerified(
            USER_ADDRESS,
            NotificationChannelType.EMAIL,
        );

        // fetch notification channels
        const notificationChannels = await db.getUsersNotificationChannels(
            USER_ADDRESS,
        );

        const expectedNotificationChannels = [
            {
                type: NotificationChannelType.EMAIL,
                config: {
                    recipientValue: 'foo@bar.de',
                    isEnabled: true,
                    isVerified: true,
                },
            },
        ];

        expect(expectedNotificationChannels).toEqual(notificationChannels);
    });
});

describe('Set users PUSH notification channel as verified', () => {
    let redisClient: Redis;
    let db: IDatabase;

    beforeEach(async () => {
        redisClient = await getRedisClient();
        db = await getDatabase(redisClient);
        await redisClient.flushDb();
    });

    afterEach(async () => {
        await redisClient.flushDb();
        await redisClient.disconnect();
    });

    it('Fail to verify as PUSH notification channel is not configured ', async () => {
        try {
            await db.setNotificationChannelAsVerified(
                USER_ADDRESS,
                NotificationChannelType.PUSH,
            );
        } catch (error) {
            expect(error.message).toBe(
                'Notification channel PUSH is not configured',
            );
        }
    });

    it('Verifies PUSH notification channel', async () => {
        const recipientValue = {
            endpoint: 'https://test.com',
            keys: {
                auth: 'authkey',
                p256dh: 'p256dh',
            },
        };

        const notificationChannel: NotificationChannel = {
            type: NotificationChannelType.PUSH,
            config: {
                recipientValue: recipientValue,
            },
        };

        // add PUSH notification channel
        await db.addUsersNotificationChannel(USER_ADDRESS, notificationChannel);

        // set PUSH channel as verified
        await db.setNotificationChannelAsVerified(
            USER_ADDRESS,
            NotificationChannelType.PUSH,
        );

        // fetch notification channels
        const notificationChannels = await db.getUsersNotificationChannels(
            USER_ADDRESS,
        );

        const expectedNotificationChannels = [
            {
                type: NotificationChannelType.PUSH,
                config: {
                    recipientValue: recipientValue,
                    isEnabled: true,
                    isVerified: true,
                },
            },
        ];

        expect(expectedNotificationChannels).toEqual(notificationChannels);
    });
});
