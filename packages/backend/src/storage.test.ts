import { generateAuthJWT } from '@dm3-org/dm3-lib-server-side';
import { sha256 } from '@dm3-org/dm3-lib-shared';
import {
    MockDeliveryServiceProfile,
    MockMessageFactory,
    MockedUserProfile,
    getMockDeliveryServiceProfile,
    mockUserProfile,
} from '@dm3-org/dm3-lib-test-helper';
import { PrismaClient } from '@prisma/client';
import bodyParser from 'body-parser';
import { ethers } from 'ethers';
import express from 'express';
import request from 'supertest';
import { IBackendDatabase, getDatabase } from './persistence/getDatabase';
import { MessageRecord } from './persistence/storage/postgres/dto/MessageRecord';
import storage from './storage';

const keysA = {
    encryptionKeyPair: {
        publicKey: 'eHmMq29FeiPKfNPkSctPuZGXvV0sKeO/KZkX2nXvMgw=',
        privateKey: 'pMI77F2w3GK+omZCB4A61WDqISOOnWGXR2f/MTLbqbY=',
    },
    signingKeyPair: {
        publicKey: '+tkDQWZfv9ixBmObsf8tgTHTZajwAE9muTtFAUj2e9I=',
        privateKey:
            '+DpeBjCzICFoi743/466yJunsHR55Bhr3GnqcS4cuJX62QNBZl+/2LEGY5ux/y2BMdNlqPAAT2a5O0UBSPZ70g==',
    },
    storageEncryptionKey: '+DpeBjCzICFoi743/466yJunsHR55Bhr3GnqcS4cuJU=',
    storageEncryptionNonce: 0,
};

const serverSecret = 'veryImportantSecretToGenerateAndValidateJSONWebTokens';

describe('Storage', () => {
    let app;
    let token = generateAuthJWT('bob.eth', serverSecret);
    let prisma: PrismaClient;
    let sender: MockedUserProfile;
    let receiver: MockedUserProfile;
    let deliveryService: MockDeliveryServiceProfile;

    beforeEach(async () => {
        prisma = new PrismaClient();

        app = express();
        app.use(bodyParser.json());

        //token = await createAuthToken();

        const bobWallet = ethers.Wallet.createRandom();
        const aliceWallet = ethers.Wallet.createRandom();
        const dsWallet = ethers.Wallet.createRandom();

        sender = await mockUserProfile(bobWallet, 'bob.eth', [
            'http://localhost:3000',
        ]);
        receiver = await mockUserProfile(aliceWallet, 'alice.eth', [
            'http://localhost:3000',
        ]);
        deliveryService = await getMockDeliveryServiceProfile(
            dsWallet,
            'http://localhost:3000',
        );

        const db = await getDatabase(prisma);

        const dbMocked = {
            hasAccount: (ensName: string) => true,
        };
        const dbFinal: IBackendDatabase = { ...db, ...dbMocked };

        //const web3ProviderBase = getWeb3Provider(process.env);

        const web3ProviderMock = {
            resolveName: async () =>
                '0x71CB05EE1b1F506fF321Da3dac38f25c0c9ce6E1',
        };

        // const web3Provider: ethers.providers.JsonRpcProvider = {
        //     ...web3ProviderBase,
        //     ...web3ProviderMock,
        // };

        app.use(storage(dbFinal, web3ProviderMock as any, serverSecret));
    });

    afterEach(async () => {
        await prisma.encryptedMessage.deleteMany();
        await prisma.conversation.deleteMany();
        await prisma.account.deleteMany();
    });

    describe('addConversation', () => {
        it('can add conversation', async () => {
            const aliceId = 'alice.eth';

            const { status } = await request(app)
                .post(`/new/bob.eth/addConversation`)
                .set({
                    authorization: 'Bearer ' + token,
                })
                .send({
                    encryptedContactName: aliceId,
                });
            expect(status).toBe(200);

            const { body } = await request(app)
                .get(`/new/bob.eth/getConversations`)
                .set({
                    authorization: 'Bearer ' + token,
                })
                .send();

            expect(status).toBe(200);
            expect(body[0].contact).toEqual(aliceId);
            expect(body.length).toBe(1);
        });
        it('can add conversation with encryptedProfileLocation', async () => {
            const aliceId = 'alice.eth';

            const { status } = await request(app)
                .post(`/new/bob.eth/addConversation`)
                .set({
                    authorization: 'Bearer ' + token,
                })
                .send({
                    encryptedContactName: aliceId,
                    encryptedProfileLocation: '123',
                });
            expect(status).toBe(200);

            const { body } = await request(app)
                .get(`/new/bob.eth/getConversations`)
                .set({
                    authorization: 'Bearer ' + token,
                })
                .send();

            expect(status).toBe(200);
            expect(body[0].contact).toEqual(aliceId);
            expect(body[0].encryptedProfileLocation).toEqual('123');
            expect(body.length).toBe(1);
        });
        it('can update existing conversation with encryptedProfileLocation', async () => {
            const aliceId = 'alice.eth';

            const { status } = await request(app)
                .post(`/new/bob.eth/addConversation`)
                .set({
                    authorization: 'Bearer ' + token,
                })
                .send({
                    encryptedContactName: aliceId,
                    encryptedProfileLocation: '123',
                });
            expect(status).toBe(200);

            const { body } = await request(app)
                .get(`/new/bob.eth/getConversations`)
                .set({
                    authorization: 'Bearer ' + token,
                })
                .send();

            expect(status).toBe(200);
            expect(body[0].contact).toEqual(aliceId);
            expect(body[0].encryptedProfileLocation).toEqual('123');
            expect(body.length).toBe(1);

            const { status: updateStatus } = await request(app)
                .post(`/new/bob.eth/addConversation`)
                .set({
                    authorization: 'Bearer ' + token,
                })
                .send({
                    encryptedContactName: aliceId,
                    encryptedProfileLocation: '123456',
                });
            expect(updateStatus).toBe(200);

            const { body: updatedBody } = await request(app)
                .get(`/new/bob.eth/getConversations`)
                .set({
                    authorization: 'Bearer ' + token,
                });

            expect(updatedBody[0].contact).toEqual(aliceId);
            expect(updatedBody[0].encryptedProfileLocation).toEqual('123456');
        });
        it('handle duplicates add conversation', async () => {
            const aliceId = 'alice.eth';
            const ronId = 'ron.eth';

            await request(app)
                .post(`/new/bob.eth/addConversation`)
                .set({
                    authorization: 'Bearer ' + token,
                })
                .send({
                    encryptedContactName: aliceId,
                });
            await request(app)
                .post(`/new/bob.eth/addConversation`)
                .set({
                    authorization: 'Bearer ' + token,
                })
                .send({
                    encryptedContactName: ronId,
                });
            //Even tough postet the same conversation, it should not be duplicated
            await request(app)
                .post(`/new/bob.eth/addConversation`)
                .set({
                    authorization: 'Bearer ' + token,
                })
                .send({
                    encryptedContactName: aliceId,
                });

            const { body } = await request(app)
                .get(`/new/bob.eth/getConversations`)
                .set({
                    authorization: 'Bearer ' + token,
                })
                .send();
            //Ron is the last conversation added hence it should be on top
            expect(body[0].contact).toEqual(ronId);
            expect(body[1].contact).toEqual(aliceId);
            expect(body.length).toBe(2);
        });
    });
    describe('getConversations', () => {
        it('returns empty array if users has no conversations', async () => {
            const { body } = await request(app)
                .get(`/new/bob.eth/getConversations`)
                .set({
                    authorization: 'Bearer ' + token,
                })
                .send();

            //With no query param, the default size is 10
            expect(body.length).toBe(0);
        });
        it('returns first 10 conversations if no query params are provided', async () => {
            //create 15 conversations
            //async for loop
            for await (let i of Array(15).keys()) {
                await request(app)
                    .post(`/new/bob.eth/addConversation`)
                    .set({
                        authorization: 'Bearer ' + token,
                    })
                    .send({
                        encryptedContactName: 'conversation ' + i,
                    });
            }

            const { body } = await request(app)
                .get(`/new/bob.eth/getConversations`)
                .set({
                    authorization: 'Bearer ' + token,
                })
                .send();

            //With no query param, the default size is 10
            expect(body.length).toBe(10);
        });
        it('uses default value 0 for offset', async () => {
            //create 15 conversations
            for (let i = 0; i < 10; i++) {
                await request(app)
                    .post(`/new/bob.eth/addConversation`)
                    .set({
                        authorization: 'Bearer ' + token,
                    })
                    .send({
                        encryptedContactName: 'conversation ' + i,
                    });
            }

            const { body } = await request(app)
                .get(`/new/bob.eth/getConversations`)
                .query({ pageSize: 6 })
                .set({
                    authorization: 'Bearer ' + token,
                })
                .send();

            expect(body.length).toBe(6);

            expect(body[0].contact).toBe('conversation 9');
            expect(body[1].contact).toBe('conversation 8');
            expect(body[2].contact).toBe('conversation 7');
            expect(body[3].contact).toBe('conversation 6');
            expect(body[4].contact).toBe('conversation 5');
            expect(body[5].contact).toBe('conversation 4');
        });
        it('uses default default size if size query param is undefined', async () => {
            //create 15 conversations
            for (let i = 0; i < 15; i++) {
                await request(app)
                    .post(`/new/bob.eth/addConversation`)
                    .set({
                        authorization: 'Bearer ' + token,
                    })
                    .send({
                        encryptedContactName: 'conversation ' + i,
                    });
            }

            const { body } = await request(app)
                .get(`/new/bob.eth/getConversations?offset=1`)
                .set({
                    authorization: 'Bearer ' + token,
                })
                .send();

            expect(body.length).toBe(5);

            expect(body[0].contact).toBe('conversation 4');
            expect(body[1].contact).toBe('conversation 3');
            expect(body[2].contact).toBe('conversation 2');
            expect(body[3].contact).toBe('conversation 1');
            expect(body[4].contact).toBe('conversation 0');
        });
        it('returns requested conversation partition', async () => {
            //create 15 conversations
            for (let i = 0; i < 15; i++) {
                await request(app)
                    .post(`/new/bob.eth/addConversation`)
                    .set({
                        authorization: 'Bearer ' + token,
                    })
                    .send({
                        encryptedContactName: 'conversation ' + i,
                    });
            }

            const { body } = await request(app)
                .get(`/new/bob.eth/getConversations`)
                .query({
                    pageSize: 3,
                    offset: 2,
                })
                .set({
                    authorization: 'Bearer ' + token,
                })
                .send();

            //With no query param, the default size is 10
            expect(body.length).toBe(3);

            expect(body[0].contact).toBe('conversation 8');
            expect(body[1].contact).toBe('conversation 7');
            expect(body[2].contact).toBe('conversation 6');
        });
        it('last page returns less items than requested', async () => {
            //create 15 conversations
            for (let i = 0; i < 15; i++) {
                await request(app)
                    .post(`/new/bob.eth/addConversation`)
                    .set({
                        authorization: 'Bearer ' + token,
                    })
                    .send({
                        encryptedContactName: 'conversation ' + i,
                    });
            }

            const { body } = await request(app)
                .get(`/new/bob.eth/getConversations`)
                .query({
                    pageSize: 10,
                    offset: 1,
                })
                .set({
                    authorization: 'Bearer ' + token,
                })
                .send();

            //With no query param, the default size is 10
            expect(body.length).toBe(5);

            expect(body[0].contact).toBe('conversation 4');
            expect(body[1].contact).toBe('conversation 3');
            expect(body[2].contact).toBe('conversation 2');
            expect(body[3].contact).toBe('conversation 1');
            expect(body[4].contact).toBe('conversation 0');
        });
        it('returns empty list if index are out of bounds', async () => {
            //create 15 conversations
            for (let i = 0; i < 15; i++) {
                await request(app)
                    .post(`/new/bob.eth/addConversation`)
                    .set({
                        authorization: 'Bearer ' + token,
                    })
                    .send({
                        encryptedContactName: 'conversation ' + i,
                    });
            }

            const { body } = await request(app)
                .get(`/new/bob.eth/getConversations`)
                .query({
                    pageSize: 10,
                    offset: 2,
                })
                .set({
                    authorization: 'Bearer ' + token,
                })
                .send();

            //With no query param, the default size is 10
            expect(body.length).toBe(0);
        });
    });

    describe('toggleHideConversation', () => {
        it('can hide conversation', async () => {
            const aliceId = 'alice.eth';
            const ronId = 'ron.eth';

            const {} = await request(app)
                .post(`/new/bob.eth/addConversation`)
                .set({
                    authorization: 'Bearer ' + token,
                })
                .send({
                    encryptedContactName: sha256(aliceId),
                });
            const {} = await request(app)
                .post(`/new/bob.eth/addConversation`)
                .set({
                    authorization: 'Bearer ' + token,
                })
                .send({
                    encryptedContactName: sha256(ronId),
                });

            const { status: hideStatus } = await request(app)
                .post(`/new/bob.eth/toggleHideConversation`)
                .set({
                    authorization: 'Bearer ' + token,
                })
                .send({
                    encryptedContactName: sha256(aliceId),
                    hide: true,
                });

            expect(hideStatus).toBe(200);

            const { status: getMessagesStatus, body } = await request(app)
                .get(`/new/bob.eth/getConversations`)
                .set({
                    authorization: 'Bearer ' + token,
                })
                .send();

            expect(getMessagesStatus).toBe(200);
            expect(body.length).toBe(1);
            expect(body[0].contact).toEqual(sha256(ronId));
        });
        it('preview message is contained for every conversation', async () => {
            const messageFactory = MockMessageFactory(
                sender,
                receiver,
                deliveryService,
            );

            const envelop1 = await messageFactory.createEncryptedEnvelop(
                'Hello1',
            );
            const envelop2 = await messageFactory.createEncryptedEnvelop(
                'Hello2',
            );
            const envelop3 = await messageFactory.createEncryptedEnvelop(
                'Hello3',
            );

            await request(app)
                .post(`/new/bob.eth/addMessage`)
                .set({
                    authorization: 'Bearer ' + token,
                })
                .send({
                    encryptedEnvelopContainer: JSON.stringify(envelop1),
                    encryptedContactName: sha256(receiver.account.ensName),
                    messageId: '123',
                    createdAt: 0,
                    isHalted: false,
                });
            await request(app)
                .post(`/new/bob.eth/addMessage`)
                .set({
                    authorization: 'Bearer ' + token,
                })
                .send({
                    encryptedEnvelopContainer: JSON.stringify(envelop2),
                    encryptedContactName: sha256(receiver.account.ensName),
                    messageId: '456',
                    createdAt: 1,
                    isHalted: false,
                });
            await request(app)
                .post(`/new/bob.eth/addMessage`)
                .set({
                    authorization: 'Bearer ' + token,
                })
                .send({
                    encryptedEnvelopContainer: JSON.stringify(envelop3),
                    encryptedContactName: sha256(receiver.account.ensName),
                    messageId: '789',
                    createdAt: 2,
                    isHalted: false,
                });

            const { body } = await request(app)
                .get(`/new/bob.eth/getConversations`)
                .set({
                    authorization: 'Bearer ' + token,
                })
                .send();

            expect(body.length).toBe(1);
            expect(body[0].contact).toEqual(sha256(receiver.account.ensName));
            expect(JSON.parse(body[0].previewMessage)).toEqual(envelop3);
        });
    });
    describe('getMessages', () => {
        describe('schema', () => {
            it('should return 400 if offset is negative', async () => {
                const { status, body } = await request(app)
                    .get(`/new/bob.eth/getMessages/alice.eth`)
                    .query({ offset: -12 })
                    .set({
                        authorization: 'Bearer ' + token,
                    })
                    .send();

                expect(status).toBe(400);
            });

            it('should return 400 if pageSize is negative', async () => {
                const { status, body } = await request(app)
                    .get(`/new/bob.eth/getMessages/alice.eth`)
                    .query({ pageSize: -12 })
                    .set({
                        authorization: 'Bearer ' + token,
                    })
                    .send();

                expect(status).toBe(400);
            });
        });
        it('returns empty array if users has no messages', async () => {
            const { body } = await request(app)
                .get(
                    `/new/bob.eth/getMessages/${sha256(
                        receiver.account.ensName,
                    )}`,
                )
                .set({
                    authorization: 'Bearer ' + token,
                })
                .send();

            expect(body.length).toBe(0);
        });
    });
    describe('addMessage', () => {
        describe('schema', () => {
            it('should return 400 if encryptedEnvelopContainer is missing', async () => {
                const body = {
                    encryptedContactName: 'encryptedContactName',
                    messageId: 'messageId',
                    createdAt: 123,
                };
                const response = await request(app)
                    .post('/new/bob.eth/addMessage')
                    .set({
                        authorization: 'Bearer ' + token,
                    })
                    .send(body);
                expect(response.status).toBe(400);
            });

            it('should return 400 if encryptedContactName is missing', async () => {
                const body = {
                    encryptedEnvelopContainer: 'encryptedEnvelopContainer',
                    messageId: 'messageId',
                    createdAt: 123,
                };
                const response = await request(app)
                    .post('/new/bob.eth/addMessage')
                    .set({
                        authorization: 'Bearer ' + token,
                    })
                    .send(body);
                expect(response.status).toBe(400);
            });

            it('should return 400 if messageId is missing', async () => {
                const body = {
                    encryptedEnvelopContainer: 'encryptedEnvelopContainer',
                    encryptedContactName: 'encryptedContactName',
                    createdAt: 123,
                };
                const response = await request(app)
                    .post('/new/bob.eth/addMessage')
                    .set({
                        authorization: 'Bearer ' + token,
                    })
                    .send(body);
                expect(response.status).toBe(400);
            });

            it('should return 400 if createdAt is missing', async () => {
                const body = {
                    encryptedEnvelopContainer: 'encryptedEnvelopContainer',
                    encryptedContactName: 'encryptedContactName',
                    messageId: 'messageId',
                };
                const response = await request(app)
                    .post('/new/bob.eth/addMessage')
                    .set({
                        authorization: 'Bearer ' + token,
                    })
                    .send(body);
                expect(response.status).toBe(400);
            });
        });
        it('can add message', async () => {
            const messageFactory = MockMessageFactory(
                sender,
                receiver,
                deliveryService,
            );
            const envelop1 = await messageFactory.createEncryptedEnvelop(
                'Hello1',
            );

            const { status } = await request(app)
                .post(`/new/bob.eth/addMessage`)
                .set({
                    authorization: 'Bearer ' + token,
                })
                .send({
                    encryptedEnvelopContainer: JSON.stringify(envelop1),
                    encryptedContactName: sha256(receiver.account.ensName),
                    messageId: '123',
                    createdAt: 1,
                    isHalted: false,
                });
            expect(status).toBe(200);

            const { body } = await request(app)
                .get(`/new/bob.eth/getConversations`)
                .set({
                    authorization: 'Bearer ' + token,
                })
                .send();

            expect(status).toBe(200);
            expect(body[0].contact).toEqual(sha256(receiver.account.ensName));
            expect(body.length).toBe(1);

            const { status: getMessagesStatus, body: messages } = await request(
                app,
            )
                .get(
                    `/new/bob.eth/getMessages/${sha256(
                        receiver.account.ensName,
                    )}`,
                )
                .set({
                    authorization: 'Bearer ' + token,
                })
                .send();

            expect(getMessagesStatus).toBe(200);
            expect(messages.length).toBe(1);
            expect(
                JSON.parse(JSON.parse(messages[0]).encryptedEnvelopContainer),
            ).toStrictEqual(envelop1);
        });
        it('messages are separated by account id', async () => {
            const messageFactory = MockMessageFactory(
                sender,
                receiver,
                deliveryService,
            );
            const envelop = await messageFactory.createEncryptedEnvelop(
                'Hello1',
            );

            await request(app)
                .post(`/new/bob.eth/addMessage`)
                .set({
                    authorization: 'Bearer ' + token,
                })
                .send({
                    encryptedEnvelopContainer: JSON.stringify(envelop),
                    encryptedContactName: sha256(receiver.account.ensName),
                    messageId: sha256('bob.eth' + '123'),
                    createdAt: 2,
                    isHalted: false,
                });

            const tokenAlice = generateAuthJWT('alice.eth', serverSecret);

            await request(app)
                .post(`/new/alice.eth/addMessage`)
                .set({
                    authorization: 'Bearer ' + tokenAlice,
                })
                .send({
                    encryptedEnvelopContainer: JSON.stringify(envelop),
                    encryptedContactName: sha256(sender.account.ensName),
                    messageId: sha256('alice.eth' + '123'),
                    createdAt: 2,
                    isHalted: false,
                });

            const { body: bobConversations } = await request(app)
                .get(`/new/bob.eth/getConversations`)
                .set({
                    authorization: 'Bearer ' + token,
                })
                .send();
            const { body: aliceConversations } = await request(app)
                .get(`/new/alice.eth/getConversations`)
                .set({
                    authorization: 'Bearer ' + tokenAlice,
                })
                .send();

            expect(bobConversations[0].contact).toEqual(
                sha256(receiver.account.ensName),
            );
            expect(bobConversations.length).toBe(1);

            expect(aliceConversations.length).toBe(1);
            expect(aliceConversations[0].contact).toEqual(
                sha256(sender.account.ensName),
            );

            const { body: bobMessages } = await request(app)
                .get(
                    `/new/bob.eth/getMessages/${sha256(
                        receiver.account.ensName,
                    )}`,
                )
                .set({
                    authorization: 'Bearer ' + token,
                })
                .send();

            expect(bobMessages.length).toBe(1);
            expect(
                JSON.parse(
                    JSON.parse(bobMessages[0]).encryptedEnvelopContainer,
                ),
            ).toStrictEqual(envelop);

            const { body: aliceMessages } = await request(app)
                .get(
                    `/new/alice.eth/getMessages/${sha256(
                        sender.account.ensName,
                    )}`,
                )
                .set({
                    authorization: 'Bearer ' + tokenAlice,
                })
                .send();

            expect(aliceMessages.length).toBe(1);
        });
        it('conversations are order by message creation date', async () => {
            //At first create two conversations
            await request(app)
                .post(`/new/bob.eth/addConversation`)
                .set({
                    authorization: 'Bearer ' + token,
                })
                .send({
                    encryptedContactName: 'alice.eth',
                });
            await request(app)
                .post(`/new/bob.eth/addConversation`)
                .set({
                    authorization: 'Bearer ' + token,
                })
                .send({
                    encryptedContactName: 'max.eth',
                });

            const { body } = await request(app)
                .get(`/new/bob.eth/getConversations`)
                .set({
                    authorization: 'Bearer ' + token,
                })
                .send();

            expect(body.length).toBe(2);
            expect(body[0].contact).toBe('max.eth');
            expect(body[1].contact).toBe('alice.eth');

            const messageFactory = MockMessageFactory(
                sender,
                receiver,
                deliveryService,
            );
            const envelop = await messageFactory.createEncryptedEnvelop(
                'Hello1',
            );

            await request(app)
                .post(`/new/bob.eth/addMessage`)
                .set({
                    authorization: 'Bearer ' + token,
                })
                .send({
                    encryptedEnvelopContainer: JSON.stringify(envelop),
                    encryptedContactName: 'alice.eth',
                    messageId: sha256('alice.eth' + '123'),
                    createdAt: 1,
                    isHalted: false,
                });

            const { body: bobConversations } = await request(app)
                .get(`/new/bob.eth/getConversations`)
                .set({
                    authorization: 'Bearer ' + token,
                })
                .send();

            //The conversation with alice should be on top since it has the latest message
            expect(bobConversations[0].contact).toEqual('alice.eth');
            expect(bobConversations[1].contact).toEqual('max.eth');
            expect(bobConversations.length).toBe(2);
        });
        it('can add message to existing conversation', async () => {
            await request(app)
                .post(`/new/bob.eth/addConversation`)
                .set({
                    authorization: 'Bearer ' + token,
                })
                .send({
                    encryptedContactName: sha256(receiver.account.ensName),
                });

            const messageFactory = MockMessageFactory(
                sender,
                receiver,
                deliveryService,
            );
            const envelop = await messageFactory.createEncryptedEnvelop(
                'Hello1',
            );

            const { status } = await request(app)
                .post(`/new/bob.eth/addMessage`)
                .set({
                    authorization: 'Bearer ' + token,
                })
                .send({
                    encryptedEnvelopContainer: JSON.stringify(envelop),
                    encryptedContactName: sha256(receiver.account.ensName),
                    messageId: '123',
                    createdAt: 2,
                    isHalted: false,
                });
            expect(status).toBe(200);

            const { body } = await request(app)
                .get(`/new/bob.eth/getConversations`)
                .set({
                    authorization: 'Bearer ' + token,
                })
                .send();

            expect(status).toBe(200);
            expect(body[0].contact).toEqual(sha256(receiver.account.ensName));
            expect(body.length).toBe(1);

            const { status: getMessagesStatus, body: messages } = await request(
                app,
            )
                .get(
                    `/new/bob.eth/getMessages/${sha256(
                        receiver.account.ensName,
                    )}`,
                )
                .set({
                    authorization: 'Bearer ' + token,
                })
                .send();

            expect(getMessagesStatus).toBe(200);
            expect(messages.length).toBe(1);
            expect(
                JSON.parse(JSON.parse(messages[0]).encryptedEnvelopContainer),
            ).toStrictEqual(envelop);
        });
        it('cant add multiple messages with the same id', async () => {
            const messageFactory = MockMessageFactory(
                sender,
                receiver,
                deliveryService,
            );
            const envelop = await messageFactory.createEncryptedEnvelop(
                'Hello1',
            );

            await request(app)
                .post(`/new/bob.eth/addMessage`)
                .set({
                    authorization: 'Bearer ' + token,
                })
                .send({
                    encryptedEnvelopContainer: JSON.stringify(envelop),
                    encryptedContactName: sha256(receiver.account.ensName),
                    messageId: '123',
                    createdAt: 1,
                    isHalted: false,
                });
            await request(app)
                .post(`/new/bob.eth/addMessage`)
                .set({
                    authorization: 'Bearer ' + token,
                })
                .send({
                    encryptedEnvelopContainer: JSON.stringify(envelop),
                    encryptedContactName: sha256(receiver.account.ensName),
                    messageId: '456',
                    createdAt: 2,
                    isHalted: false,
                });

            const { status } = await request(app)
                .post(`/new/bob.eth/addMessage`)
                .set({
                    authorization: 'Bearer ' + token,
                })
                .send({
                    encryptedEnvelopContainer: JSON.stringify(envelop),
                    encryptedContactName: sha256(receiver.account.ensName),
                    messageId: '123',
                    createdAt: 3,
                    isHalted: false,
                });

            expect(status).toBe(400);

            const { body } = await request(app)
                .get(`/new/bob.eth/getConversations`)
                .set({
                    authorization: 'Bearer ' + token,
                })
                .send();

            expect(body[0].contact).toEqual(sha256(receiver.account.ensName));
            expect(body.length).toBe(1);

            const { status: getMessagesStatus, body: messages } = await request(
                app,
            )
                .get(
                    `/new/bob.eth/getMessages/${sha256(
                        receiver.account.ensName,
                    )}`,
                )
                .set({
                    authorization: 'Bearer ' + token,
                })
                .send();

            expect(getMessagesStatus).toBe(200);
            expect(messages.length).toBe(2);

            expect(
                JSON.parse(JSON.parse(messages[0]).encryptedEnvelopContainer),
            ).toStrictEqual(envelop);
            expect(
                JSON.parse(JSON.parse(messages[1]).encryptedEnvelopContainer),
            ).toStrictEqual(envelop);
        });
    });
    describe('halted Messages', () => {
        it('clears halted message', async () => {
            const messageFactory = MockMessageFactory(
                sender,
                receiver,
                deliveryService,
            );
            const envelop1 = await messageFactory.createEncryptedEnvelop(
                'Hello1',
            );

            const { status } = await request(app)
                .post(`/new/bob.eth/addMessage`)
                .set({
                    authorization: 'Bearer ' + token,
                })
                .send({
                    encryptedEnvelopContainer: JSON.stringify(envelop1),
                    encryptedContactName: sha256(receiver.account.ensName),
                    messageId: envelop1.metadata.messageHash,
                    createdAt: 1,
                    isHalted: true,
                });
            expect(status).toBe(200);

            const { status: getMessagesStatus, body: messages } = await request(
                app,
            )
                .get(`/new/bob.eth/getHaltedMessages/`)
                .set({
                    authorization: 'Bearer ' + token,
                })
                .send();

            expect(getMessagesStatus).toBe(200);
            expect(messages.length).toBe(1);
            expect(
                JSON.parse(messages[0].encryptedEnvelopContainer),
            ).toStrictEqual(envelop1);

            const { status: deleteStatus } = await request(app)
                .post(`/new/bob.eth/clearHaltedMessage/`)
                .set({
                    authorization: 'Bearer ' + token,
                })
                .send({
                    messageId: messages[0].messageId,
                });

            expect(deleteStatus).toBe(200);

            const {
                status: getMessagesStatusAfterDelete,
                body: messagesAfterDelete,
            } = await request(app)
                .get(`/new/bob.eth/getHaltedMessages/`)
                .set({
                    authorization: 'Bearer ' + token,
                })
                .send();

            expect(getMessagesStatusAfterDelete).toBe(200);
            expect(messagesAfterDelete.length).toBe(0);
        });
    });
    describe('addMessageBatch', () => {
        describe('schema', () => {
            it('should return 400 if encryptedContactName is missing', async () => {
                const body = {
                    messageBatch: [
                        {
                            createdAt: 123,
                            messageId: 'testMessageId',
                            encryptedEnvelopContainer:
                                'testEncryptedEnvelopContainer',
                        },
                    ],
                };
                const response = await request(app)
                    .post('/new/bob.eth/addMessageBatch')
                    .set({
                        authorization: 'Bearer ' + token,
                    })
                    .send(body);
                expect(response.status).toBe(400);
            });

            it('should return 400 if messageBatch is missing', async () => {
                const body = {
                    encryptedContactName: 'encryptedContactName',
                };
                const response = await request(app)
                    .post('/new/bob.eth/addMessageBatch')
                    .set({
                        authorization: 'Bearer ' + token,
                    })
                    .send(body);
                expect(response.status).toBe(400);
            });

            it('should return 400 if messageBatch is invalid', async () => {
                const body = {
                    encryptedContactName: 'encryptedContactName',
                    messageBatch: [{ foo: 'bar' }],
                };
                const response = await request(app)
                    .post('/new/bob.eth/addMessageBatch')
                    .set({
                        authorization: 'Bearer ' + token,
                    })
                    .send(body);
                expect(response.status).toBe(400);
            });
        });
        it('can add a messageBatch', async () => {
            const messageFactory = MockMessageFactory(
                sender,
                receiver,
                deliveryService,
            );
            const envelop = await messageFactory.createEncryptedEnvelop(
                'Hello1',
            );
            const { status } = await request(app)
                .post(`/new/bob.eth/addMessageBatch`)
                .set({
                    authorization: 'Bearer ' + token,
                })
                .send({
                    encryptedContactName: sha256(receiver.account.ensName),
                    messageBatch: [
                        {
                            encryptedEnvelopContainer: JSON.stringify(envelop),
                            messageId: '123',
                            createdAt: 1,
                            isHalted: false,
                        },
                        {
                            encryptedEnvelopContainer: JSON.stringify(envelop),
                            messageId: '456',
                            createdAt: 2,
                            isHalted: false,
                        },
                    ],
                });
            expect(status).toBe(200);

            const { body } = await request(app)
                .get(`/new/bob.eth/getConversations`)
                .set({
                    authorization: 'Bearer ' + token,
                })
                .send();

            expect(status).toBe(200);
            expect(body[0].contact).toEqual(sha256(receiver.account.ensName));
            expect(body.length).toBe(1);

            const { status: getMessagesStatus, body: messages } = await request(
                app,
            )
                .get(
                    `/new/bob.eth/getMessages/${sha256(
                        receiver.account.ensName,
                    )}`,
                )
                .set({
                    authorization: 'Bearer ' + token,
                })
                .send();

            expect(getMessagesStatus).toBe(200);
            expect(messages.length).toBe(2);
            expect(
                JSON.parse(JSON.parse(messages[0]).encryptedEnvelopContainer),
            ).toStrictEqual(envelop);
        });
        it('if batch contains duplicates it only creates the message once', async () => {
            const messageFactory = MockMessageFactory(
                sender,
                receiver,
                deliveryService,
            );
            const envelop = await messageFactory.createEncryptedEnvelop(
                'Hello1',
            );
            const { status } = await request(app)
                .post(`/new/bob.eth/addMessageBatch`)
                .set({
                    authorization: 'Bearer ' + token,
                })
                .send({
                    encryptedContactName: sha256(receiver.account.ensName),
                    messageBatch: [
                        {
                            encryptedEnvelopContainer: JSON.stringify(envelop),
                            messageId: '123',
                            createdAt: 1,
                            isHalted: false,
                        },
                        {
                            encryptedEnvelopContainer: JSON.stringify(envelop),
                            messageId: '123',
                            createdAt: 1,
                            isHalted: false,
                        },
                        {
                            encryptedEnvelopContainer: JSON.stringify(envelop),
                            messageId: '456',
                            createdAt: 2,
                            isHalted: false,
                        },
                    ],
                });
            expect(status).toBe(200);

            const { body } = await request(app)
                .get(`/new/bob.eth/getConversations`)
                .set({
                    authorization: 'Bearer ' + token,
                })
                .send();

            expect(status).toBe(200);
            expect(body[0].contact).toEqual(sha256(receiver.account.ensName));
            expect(body.length).toBe(1);

            const { status: getMessagesStatus, body: messages } = await request(
                app,
            )
                .get(
                    `/new/bob.eth/getMessages/${sha256(
                        receiver.account.ensName,
                    )}`,
                )
                .set({
                    authorization: 'Bearer ' + token,
                })
                .send();

            expect(getMessagesStatus).toBe(200);
            expect(messages.length).toBe(2);
            expect(
                JSON.parse(JSON.parse(messages[0]).encryptedEnvelopContainer),
            ).toStrictEqual(envelop);
        });
    });
    describe('getNumberOfMessages', () => {
        it('can get number of messages', async () => {
            const messageFactory = MockMessageFactory(
                sender,
                receiver,
                deliveryService,
            );
            const envelop = await messageFactory.createEncryptedEnvelop(
                'Hello1',
            );
            const x = await request(app)
                .post(`/new/bob.eth/addMessage`)
                .set({
                    authorization: 'Bearer ' + token,
                })
                .send({
                    encryptedEnvelopContainer: JSON.stringify(envelop),
                    encryptedContactName: sha256(receiver.account.ensName),
                    messageId: '123',
                    createdAt: 1,
                    isHalted: false,
                });

            await request(app)
                .post(`/new/bob.eth/addMessage`)
                .set({
                    authorization: 'Bearer ' + token,
                })
                .send({
                    encryptedEnvelopContainer: JSON.stringify(envelop),
                    encryptedContactName: sha256(receiver.account.ensName),
                    messageId: '456',
                    createdAt: 2,
                    isHalted: false,
                });

            const { status: addDuplicateStatus } = await request(app)
                .post(`/new/bob.eth/addMessage`)
                .set({
                    authorization: 'Bearer ' + token,
                })
                .send({
                    encryptedEnvelopContainer: JSON.stringify(envelop),
                    encryptedContactName: sha256(receiver.account.ensName),
                    messageId: '123',
                    createdAt: 3,
                    isHalted: false,
                });

            const { status, body } = await request(app)
                .get(
                    `/new/bob.eth/getNumberOfMessages/${sha256(
                        receiver.account.ensName,
                    )}`,
                )
                .set({
                    authorization: 'Bearer ' + token,
                })
                .send();
            expect(status).toBe(200);
            expect(body).toBe(2);
        });
    });
    describe('getNumberOfConversations', () => {
        it('can get number of conversations', async () => {
            const aliceId = 'alice.eth';
            const bobId = 'bob.eth';

            const { status } = await request(app)
                .post(`/new/bob.eth/addConversation`)
                .set({
                    authorization: 'Bearer ' + token,
                })
                .send({
                    encryptedContactName: aliceId,
                });
            expect(status).toBe(200);

            const { status: secondStatus } = await request(app)
                .post(`/new/bob.eth/addConversation`)
                .set({
                    authorization: 'Bearer ' + token,
                })
                .send({
                    encryptedContactName: 'testContact',
                });
            expect(secondStatus).toBe(200);

            const { status: thirdStatus } = await request(app)
                .post(`/new/bob.eth/addConversation`)
                .set({
                    authorization: 'Bearer ' + token,
                })
                .send({
                    encryptedContactName: 'testContact2',
                });
            expect(thirdStatus).toBe(200);

            const { status: fourthStatus, body } = await request(app)
                .get(`/new/bob.eth/getNumberOfConversations`)
                .set({
                    authorization: 'Bearer ' + token,
                })
                .send();
            expect(fourthStatus).toBe(200);
            expect(body).toBe(3);
        });
    });
    describe('editMessageBatch', () => {
        describe('schema', () => {
            it('should return 400 if encryptedContactName is missing', async () => {
                const body = {
                    editMessageBatchPayload: [
                        {
                            createdAt: 123,
                            messageId: 'testMessageId',
                            encryptedEnvelopContainer:
                                'testEncryptedEnvelopContainer',
                            isHalted: false,
                        },
                    ],
                };
                const response = await request(app)
                    .post('/new/bob.eth/editMessageBatch')
                    .set({
                        authorization: 'Bearer ' + token,
                    })
                    .send(body);
                expect(response.status).toBe(400);
            });
            it('should return 400 if editMessageBatchPayload is invalid', async () => {
                const body = {
                    editMessageBatchPayload: [
                        {
                            foo: 'bar',
                        },
                    ],
                };
                const response = await request(app)
                    .post('/new/bob.eth/editMessageBatch')
                    .set({
                        authorization: 'Bearer ' + token,
                    })
                    .send(body);
                expect(response.status).toBe(400);
            });

            it('should return 400 if editMessageBatchPayload is missing', async () => {
                const body = {
                    encryptedContactName: 'encryptedContactName',
                };
                const response = await request(app)
                    .post('/new/bob.eth/editMessageBatch')
                    .set({
                        authorization: 'Bearer ' + token,
                    })
                    .send(body);
                expect(response.status).toBe(400);
            });
        });
        it('should create a message if they has not been created before', async () => {
            const encryptedContactName = 'testContactName';
            const payload: MessageRecord[] = [
                {
                    createdAt: 123,
                    messageId: 'testMessageId',
                    encryptedEnvelopContainer: 'testEncryptedEnvelopContainer',
                    isHalted: false,
                },
            ];

            const { status } = await request(app)
                .post(`/new/bob.eth/editMessageBatch`)
                .set({
                    authorization: 'Bearer ' + token,
                })
                .send({
                    encryptedContactName,
                    editMessageBatchPayload: payload,
                });

            expect(status).toBe(200);

            //get messages
            const { body } = await request(app)
                .get(`/new/bob.eth/getMessages/${encryptedContactName}`)
                .set({
                    authorization: 'Bearer ' + token,
                })
                .send();

            expect(body.length).toBe(1);
            expect(JSON.parse(body[0]).encryptedEnvelopContainer).toBe(
                payload[0].encryptedEnvelopContainer,
            );
        });

        it('should update encryptedMessage message', async () => {
            const contactName = 'testContactName';
            const originalPayload: MessageRecord[] = [
                {
                    createdAt: 123,
                    messageId: 'testMessageId',
                    encryptedEnvelopContainer: 'testEncryptedEnvelopContainer',
                    isHalted: false,
                },
            ];
            const { status } = await request(app)
                .post(`/new/bob.eth/addMessage`)
                .set({
                    authorization: 'Bearer ' + token,
                })
                .send({
                    encryptedEnvelopContainer: JSON.stringify(originalPayload),
                    encryptedContactName: sha256(receiver.account.ensName),
                    messageId: '123',
                    createdAt: 123456,
                    isHalted: false,
                });
            expect(status).toBe(200);

            const updatedPayload: MessageRecord[] = [
                {
                    createdAt: 123,
                    messageId: 'testMessageId',
                    encryptedEnvelopContainer: 'NEW ENVELOP',
                    isHalted: false,
                },
            ];

            const { status: editStatus } = await request(app)
                .post(`/new/bob.eth/editMessageBatch`)
                .set({
                    authorization: 'Bearer ' + token,
                })
                .send({
                    encryptedContactName: contactName,
                    editMessageBatchPayload: updatedPayload,
                });

            expect(editStatus).toBe(200);

            //get messages
            const { body } = await request(app)
                .get(`/new/bob.eth/getMessages/${contactName}`)
                .set({
                    authorization: 'Bearer ' + token,
                })
                .send();

            expect(body.length).toBe(1);
            expect(JSON.parse(body[0]).encryptedEnvelopContainer).toBe(
                updatedPayload[0].encryptedEnvelopContainer,
            );
        });
    });
});
