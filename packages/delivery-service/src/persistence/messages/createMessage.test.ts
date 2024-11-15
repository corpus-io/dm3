import { Redis, IDatabase, getRedisClient, getDatabase } from '../getDatabase';
import {
    DeliveryInformation,
    EncryptionEnvelop,
} from '@dm3-org/dm3-lib-messaging';

const SENDER_ADDRESS = '0x25A643B6e52864d0eD816F1E43c0CF49C83B8292';
const RECEIVER_ADDRESS = '0xDd36ae7F9a8E34FACf1e110c6e9d37D0dc917855';

describe('Create Message', () => {
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

    it('Creates a new Message ', async () => {
        const envelop: EncryptionEnvelop = {
            message: '',
            metadata: {
                deliveryInformation: '',
                signature: '',
                messageHash: '',
                version: '',
                encryptionScheme: 'x25519-chacha20-poly1305',
            },
        };

        const conversionId = SENDER_ADDRESS + RECEIVER_ADDRESS;

        const priorCreateMessages = await db.getMessages(conversionId, 0, 50);

        expect(priorCreateMessages.length).toBe(0);

        await db.createMessage(RECEIVER_ADDRESS, conversionId, envelop);

        const afterCreateMessages = await db.getMessages(conversionId, 0, 50);

        expect(afterCreateMessages.length).toBe(1);
    });
    it('Add a messages to incoming conversations set ', async () => {
        const envelop: EncryptionEnvelop = {
            message: '',
            metadata: {
                deliveryInformation: {
                    to: RECEIVER_ADDRESS,
                    from: SENDER_ADDRESS,
                    deliveryInstruction: '',
                },
                signature: '',
                messageHash: '',
                version: '',
                encryptionScheme: 'x25519-chacha20-poly1305',
            },
        };

        const firstMessageConversionId = SENDER_ADDRESS + RECEIVER_ADDRESS;
        const secondMessageConversionId = RECEIVER_ADDRESS + RECEIVER_ADDRESS;

        await db.createMessage(
            RECEIVER_ADDRESS,
            firstMessageConversionId,
            envelop,
        );
        await db.createMessage(RECEIVER_ADDRESS, secondMessageConversionId, {
            ...envelop,
            message: 'foo',
            metadata: {
                ...envelop.metadata,
                deliveryInformation: {
                    ...(envelop.metadata
                        .deliveryInformation as DeliveryInformation),
                    to: RECEIVER_ADDRESS,
                },
            },
        });

        const incomingConversations = await db.getIncomingMessages(
            RECEIVER_ADDRESS,
            10,
        );

        expect(incomingConversations.length).toBe(2);
    });

    it('Rejcts message with an invalid schema', async () => {
        const invalidMessage = {} as EncryptionEnvelop;
        try {
            await db.createMessage(RECEIVER_ADDRESS, 'foo', invalidMessage);
            fail();
        } catch (e) {
            expect(e).toStrictEqual(Error('Invalid message'));
        }
    });
});
