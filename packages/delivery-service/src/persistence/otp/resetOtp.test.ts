import { NotificationChannelType } from '@dm3-org/dm3-lib-shared';
import { IDatabase, Redis, getDatabase, getRedisClient } from '../getDatabase';

const USER_ADDRESS = '0x25A643B6e52864d0eD816F1E43c0CF49C83B8292';

describe('Reset OTP', () => {
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

    it('Reset OTP data', async () => {
        const otp = '19283';
        const generatedAt = new Date();

        // set email OTP
        await db.setOtp(
            USER_ADDRESS,
            otp,
            NotificationChannelType.EMAIL,
            generatedAt,
        );

        // fetch OTP from Redis after setting OTP
        const afterSettingOtp = await db.getOtp(
            USER_ADDRESS,
            NotificationChannelType.EMAIL,
        );

        const expectedData = {
            generatedAt: generatedAt,
            otp: otp,
            type: NotificationChannelType.EMAIL,
        };

        // check OTP is set
        expect(JSON.stringify(afterSettingOtp)).toEqual(
            JSON.stringify(expectedData),
        );

        // reset the otp
        await db.resetOtp(USER_ADDRESS, NotificationChannelType.EMAIL);

        // fetch the OTP after reset
        const afterResetingOtp = await db.getOtp(
            USER_ADDRESS,
            NotificationChannelType.EMAIL,
        );

        // otp data must be null after reset
        expect(afterResetingOtp).toBe(null);
    });
});
