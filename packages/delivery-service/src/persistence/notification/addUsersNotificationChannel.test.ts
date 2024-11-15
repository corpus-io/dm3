import {
    NotificationChannel,
    NotificationChannelType,
} from '@dm3-org/dm3-lib-shared';
import { IDatabase, Redis, getDatabase, getRedisClient } from '../getDatabase';

const USER_ADDRESS = '0x25A643B6e52864d0eD816F1E43c0CF49C83B8292';

describe('Set Users NotificationChannel', () => {
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

    it('Add Email Notification Channel ', async () => {
        const notificationChannel: NotificationChannel = {
            type: NotificationChannelType.EMAIL,
            config: {
                recipientValue: 'foo@bar.de',
            },
        };

        const priorSetUsersNotificationChannel =
            await db.getUsersNotificationChannels(USER_ADDRESS);

        //User has no account yet
        expect(priorSetUsersNotificationChannel).toEqual([]);
        await db.addUsersNotificationChannel(USER_ADDRESS, notificationChannel);

        const afterSetAccount = await db.getUsersNotificationChannels(
            USER_ADDRESS,
        );
        expect(afterSetAccount).toEqual([notificationChannel]);
    });

    it('Rejects Notification Channel with an invalid schema', async () => {
        try {
            const notificationChannel: any = {
                foo: NotificationChannelType.EMAIL,
                config: {
                    recipientValue: 'foo@bar.de',
                },
            };

            await db.addUsersNotificationChannel(
                USER_ADDRESS,
                notificationChannel,
            );
            throw new Error('Invalid NotificationChannel');
        } catch (e) {
            expect(e).toStrictEqual(Error('Invalid NotificationChannel'));
        }
    });

    it('Rejects Email Notification Channel with an invalid config', async () => {
        try {
            const notificationChannel: any = {
                type: NotificationChannelType.EMAIL,
                config: {
                    recipientValue: 'foo@bar.de',
                },
            };

            await db.addUsersNotificationChannel(
                USER_ADDRESS,
                notificationChannel,
            );
            throw new Error('Invalid Email config');
        } catch (e) {
            expect(e).toStrictEqual(Error('Invalid Email config'));
        }
    });

    it('Rejects Email Notification Channel with an invalid email address', async () => {
        try {
            const notificationChannel: any = {
                type: NotificationChannelType.EMAIL,
                config: {
                    recipientValue: '12345',
                },
            };

            await db.addUsersNotificationChannel(
                USER_ADDRESS,
                notificationChannel,
            );
            throw new Error('Invalid Email config');
        } catch (e) {
            expect(e).toStrictEqual(Error('Invalid Email config'));
        }
    });

    it('Add Push Notification Channel ', async () => {
        const notificationChannel: NotificationChannel = {
            type: NotificationChannelType.PUSH,
            config: {
                recipientValue: {
                    endpoint: 'https://test.com',
                    keys: {
                        auth: 'authkey',
                        p256dh: 'p256dh',
                    },
                },
            },
        };

        const priorSetUsersNotificationChannel =
            await db.getUsersNotificationChannels(USER_ADDRESS);

        //User has no account yet
        expect(priorSetUsersNotificationChannel).toEqual([]);
        await db.addUsersNotificationChannel(USER_ADDRESS, notificationChannel);

        const afterSetAccount = await db.getUsersNotificationChannels(
            USER_ADDRESS,
        );
        expect(afterSetAccount).toEqual([notificationChannel]);
    });

    it('Rejects Push Notification Channel with an invalid schema', async () => {
        try {
            const notificationChannel: any = {
                foo: NotificationChannelType.PUSH,
                config: {
                    recipientValue: {
                        endpoint: 'https://test.com',
                        keys: {
                            auth: 'authkey',
                            p256dh: 'p256dh',
                        },
                    },
                },
            };

            await db.addUsersNotificationChannel(
                USER_ADDRESS,
                notificationChannel,
            );

            throw new Error('Invalid NotificationChannel');
        } catch (e) {
            expect(e).toStrictEqual(Error('Invalid NotificationChannel'));
        }
    });

    it('Rejects Push Notification Channel with an invalid subscription data', async () => {
        try {
            const notificationChannel: any = {
                type: NotificationChannelType.PUSH,
                config: {
                    recipientValue: '12345',
                },
            };

            await db.addUsersNotificationChannel(
                USER_ADDRESS,
                notificationChannel,
            );

            throw new Error('Invalid Push notification configuration data');
        } catch (e) {
            expect(e).toStrictEqual(
                Error('Invalid Push notification configuration data'),
            );
        }
    });
});
