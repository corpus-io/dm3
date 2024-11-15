import { EncryptionEnvelop } from '@dm3-org/dm3-lib-messaging';
import { IDatabase, Redis, getDatabase, getRedisClient } from '../getDatabase';

const SENDER_ADDRESS = '0x25A643B6e52864d0eD816F1E43c0CF49C83B8292';
const RECEIVER_ADDRESS = '0xDd36ae7F9a8E34FACf1e110c6e9d37D0dc917855';

describe('Sync Acknowledge', () => {
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

    it('Removes acknowledged messages from DS', async () => {
        const envelop1: EncryptionEnvelop = {
            message: '',
            metadata: {
                deliveryInformation: {
                    to: RECEIVER_ADDRESS,
                    from: SENDER_ADDRESS,
                },
                signature: '',
                messageHash: '0x123',
                version: '',
                encryptionScheme: 'x25519-chacha20-poly1305',
            },
        };
        const envelop2: EncryptionEnvelop = {
            message: '',
            metadata: {
                deliveryInformation: {
                    to: RECEIVER_ADDRESS,
                    from: SENDER_ADDRESS,
                },
                signature: '',
                messageHash: '0x456',
                version: '',
                encryptionScheme: 'x25519-chacha20-poly1305',
            },
        };

        const conversionId = SENDER_ADDRESS + RECEIVER_ADDRESS;

        const priorCreateMessages = await db.getIncomingMessages(
            RECEIVER_ADDRESS,
            10,
        );

        expect(priorCreateMessages.length).toBe(0);

        await db.createMessage(RECEIVER_ADDRESS, conversionId, envelop1);
        await db.createMessage(RECEIVER_ADDRESS, conversionId, envelop2);

        const afterCreateMessages = await db.getIncomingMessages(
            RECEIVER_ADDRESS,
            10,
        );

        expect(afterCreateMessages.length).toBe(2);

        const res = await db.syncAcknowledge(conversionId, '0x123');

        expect(res).toBe(true);

        const afterSyncAcknowledge = await db.getIncomingMessages(
            RECEIVER_ADDRESS,
            10,
        );

        expect(afterSyncAcknowledge.length).toBe(1);
        expect(afterSyncAcknowledge[0].metadata.messageHash).toBe('0x456');
    });
    it('returns false if message is not found', async () => {
        const envelop1: EncryptionEnvelop = {
            message: '',
            metadata: {
                deliveryInformation: {
                    to: RECEIVER_ADDRESS,
                    from: SENDER_ADDRESS,
                },
                signature: '',
                messageHash: '0x123',
                version: '',
                encryptionScheme: 'x25519-chacha20-poly1305',
            },
        };

        const conversionId = SENDER_ADDRESS + RECEIVER_ADDRESS;

        const priorCreateMessages = await db.getIncomingMessages(
            RECEIVER_ADDRESS,
            10,
        );

        expect(priorCreateMessages.length).toBe(0);

        await db.createMessage(RECEIVER_ADDRESS, conversionId, envelop1);

        const afterCreateMessages = await db.getIncomingMessages(
            RECEIVER_ADDRESS,
            10,
        );

        expect(afterCreateMessages.length).toBe(1);

        const res = await db.syncAcknowledge(conversionId, 'foooo');

        expect(res).toBe(false);
    });
});
