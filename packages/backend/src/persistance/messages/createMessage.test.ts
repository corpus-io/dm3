import { Redis, IDatabase, getRedisClient, getDatabase } from '../getDatabase';
import * as Lib from 'dm3-lib/dist.backend';
import winston from 'winston';

const SENDER_ADDRESS = '0x25A643B6e52864d0eD816F1E43c0CF49C83B8292';
const RECEIVER_ADDRESS = '0xDd36ae7F9a8E34FACf1e110c6e9d37D0dc917855';

describe('Create Message', () => {
    let redisClient: Redis;
    let db: IDatabase;
    const logger = winston.createLogger({
        transports: [new winston.transports.Console()],
    });

    beforeEach(async () => {
        redisClient = await getRedisClient(logger);
        db = await getDatabase(logger, redisClient);
        await redisClient.flushDb();
    });

    afterEach(async () => {
        await redisClient.flushDb();
        await redisClient.disconnect();
    });

    it('Creates a new Message ', async () => {
        const envelop: Lib.messaging.EncryptionEnvelop = {
            message: '',
            metadata: {
                deliveryInformation: '',
                signature: '',
                encryptedMessageHash: '',
                version: '',
                encryptionScheme: 'x25519-chacha20-poly1305',
            },
        };

        const conversionId = SENDER_ADDRESS + RECEIVER_ADDRESS;

        const priorCreateMessages = await db.getMessages(conversionId, 0, 50);

        expect(priorCreateMessages.length).toBe(0);

        await db.createMessage(conversionId, envelop);

        const afterCreateMessages = await db.getMessages(conversionId, 0, 50);

        expect(afterCreateMessages.length).toBe(1);
    });
    it('Add a messages to incoming conversations set ', async () => {
        const envelop: Lib.messaging.EncryptionEnvelop = {
            message: '',
            metadata: {
                deliveryInformation: {
                    to: RECEIVER_ADDRESS,
                    from: SENDER_ADDRESS,
                    deliveryInstruction: '',
                },
                signature: '',
                encryptedMessageHash: '',
                version: '',
                encryptionScheme: 'x25519-chacha20-poly1305',
            },
        };

        const firstMessageConversionId = SENDER_ADDRESS + RECEIVER_ADDRESS;
        const secondMessageConversionId = RECEIVER_ADDRESS + RECEIVER_ADDRESS;

        await db.createMessage(firstMessageConversionId, envelop);
        await db.createMessage(secondMessageConversionId, {
            ...envelop,
            message: 'foo',
            metadata: {
                ...envelop.metadata,
                deliveryInformation: {
                    ...(envelop.metadata
                        .deliveryInformation as Lib.messaging.DeliveryInformation),
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
        const invalidMessage = {} as Lib.messaging.EncryptionEnvelop;
        try {
            await db.createMessage('foo', invalidMessage);
            fail();
        } catch (e) {
            expect(e).toStrictEqual(Error('Invalid message'));
        }
    });
});
