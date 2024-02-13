import {
    NotificationChannel,
    NotificationChannelType,
    NotificationError,
} from '@dm3-org/dm3-lib-delivery';
import { IDatabase, Redis, getDatabase, getRedisClient } from '../getDatabase';
import winston from 'winston';

const USER_ADDRESS = '0x25A643B6e52864d0eD816F1E43c0CF49C83B8292';

global.logger = winston.createLogger({
    transports: [new winston.transports.Console()],
});

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
