import { IDatabase, Redis, getDatabase, getRedisClient } from '../getDatabase';

const USER_ADDRESS = '0x25A643B6e52864d0eD816F1E43c0CF49C83B8292';

describe('Set Users Global Notification', () => {
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

    it('Enable Global Notification', async () => {
        const priorGlobalNotification = await db.getGlobalNotification(
            USER_ADDRESS,
        );

        // User's global notification is false initially
        expect(priorGlobalNotification).toEqual({
            isEnabled: false,
        });

        // set global notification to true
        await db.setGlobalNotification(USER_ADDRESS, true);

        const afterSettingGlobalNotification = await db.getGlobalNotification(
            USER_ADDRESS,
        );

        expect(afterSettingGlobalNotification).toEqual({
            isEnabled: true,
        });
    });

    it('Disable Global Notification', async () => {
        // set global notification to true
        await db.setGlobalNotification(USER_ADDRESS, true);

        const enabledGlobalNotification = await db.getGlobalNotification(
            USER_ADDRESS,
        );

        // global notification should be true
        expect(enabledGlobalNotification).toEqual({
            isEnabled: true,
        });

        // set global notification to false
        await db.setGlobalNotification(USER_ADDRESS, false);

        const disabledGlobalNotification = await db.getGlobalNotification(
            USER_ADDRESS,
        );

        // global notification should be false
        expect(disabledGlobalNotification).toEqual({
            isEnabled: false,
        });
    });
});
