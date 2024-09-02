import { NotificationChannelType } from '@dm3-org/dm3-lib-shared';
import { IDatabase, Redis, getDatabase, getRedisClient } from '../getDatabase';
import winston from 'winston';

const USER_ADDRESS = '0x25A643B6e52864d0eD816F1E43c0CF49C83B8292';

global.logger = winston.createLogger({
    transports: [new winston.transports.Console()],
});

describe('Email Verification OTP', () => {
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

    it('Set Email Verification OTP', async () => {
        const otp = '19283';
        const generatedAt = new Date();

        // fetch OTP from Redis
        const priorOtp = await db.getOtp(
            USER_ADDRESS,
            NotificationChannelType.EMAIL,
        );

        // User's email otp is null initially
        expect(priorOtp).toEqual(null);

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

        expect(JSON.stringify(afterSettingOtp)).toEqual(
            JSON.stringify(expectedData),
        );
    });
});
