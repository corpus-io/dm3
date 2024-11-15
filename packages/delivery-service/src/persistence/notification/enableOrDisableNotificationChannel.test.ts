import {
    NotificationChannelType,
    NotificationChannel,
} from '@dm3-org/dm3-lib-shared';
import { IDatabase, Redis, getDatabase, getRedisClient } from '../getDatabase';

const USER_ADDRESS = '0x25A643B6e52864d0eD816F1E43c0CF49C83B8292';

describe('Enables/Disables users EMAIL notification channel', () => {
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

    it('Failed to disable EMAIL notification channel as it is not configured', async () => {
        try {
            await db.enableOrDisableNotificationChannel(
                USER_ADDRESS,
                NotificationChannelType.EMAIL,
                true,
            );
        } catch (error) {
            expect(error.message).toBe(
                'Notification channel EMAIL is not configured',
            );
        }
    });

    it('Disables EMAIL notification channel', async () => {
        const notificationChannel: NotificationChannel = {
            type: NotificationChannelType.EMAIL,
            config: {
                recipientValue: 'foo@bar.de',
            },
        };

        // add EMAIL notification channel
        await db.addUsersNotificationChannel(USER_ADDRESS, notificationChannel);

        // set EMAIL channel as disabled
        await db.enableOrDisableNotificationChannel(
            USER_ADDRESS,
            NotificationChannelType.EMAIL,
            false,
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
                    isEnabled: false,
                    isVerified: false,
                },
            },
        ];

        expect(expectedNotificationChannels).toEqual(notificationChannels);
    });

    it('Failed to enable EMAIL notification channel as it is not configured', async () => {
        try {
            await db.enableOrDisableNotificationChannel(
                USER_ADDRESS,
                NotificationChannelType.EMAIL,
                true,
            );
        } catch (error) {
            expect(error.message).toBe(
                'Notification channel EMAIL is not configured',
            );
        }
    });

    it('Enables EMAIL notification channel', async () => {
        const notificationChannel: NotificationChannel = {
            type: NotificationChannelType.EMAIL,
            config: {
                recipientValue: 'foo@bar.de',
            },
        };

        // add EMAIL notification channel
        await db.addUsersNotificationChannel(USER_ADDRESS, notificationChannel);

        // set EMAIL channel as disabled
        await db.enableOrDisableNotificationChannel(
            USER_ADDRESS,
            NotificationChannelType.EMAIL,
            false,
        );

        // set EMAIL channel as enabled
        await db.enableOrDisableNotificationChannel(
            USER_ADDRESS,
            NotificationChannelType.EMAIL,
            true,
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
                    isVerified: false,
                },
            },
        ];

        expect(expectedNotificationChannels).toEqual(notificationChannels);
    });
});
