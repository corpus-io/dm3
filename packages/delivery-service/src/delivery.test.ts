import { generateAuthJWT } from '@dm3-org/dm3-lib-server-side';
import bodyParser from 'body-parser';
import express from 'express';
import request from 'supertest';
import delivery from './delivery';
import { Redis, getDatabase, getRedisClient } from './persistence/getDatabase';

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

const serverSecret = 'veryImportantSecret';

let redisClient: Redis;
describe('Delivery', () => {
    beforeEach(async () => {
        redisClient = await getRedisClient();
        await redisClient.flushDb();
    });

    afterEach(async () => {
        await redisClient.flushDb();
        await redisClient.disconnect();
    });

    describe('getMessages', () => {
        it('Returns 200 if schema is valid', async () => {
            const web3Provider = {
                resolveName: async () =>
                    '0x99C19AB10b9EC8aC6fcda9586E81f6B73a298870',
            };
            const token = await createAuthToken('alice.eth');

            const db = {
                getAccount: async (ensName: string) =>
                    Promise.resolve({
                        challenge: 'my-Challenge',
                        signedUserProfile: {
                            profile: {
                                publicSigningKey:
                                    keysA.signingKeyPair.publicKey,
                            },
                        },
                        token,
                    }),
                setAccount: async (_: string, __: any) => {
                    return (_: any, __: any, ___: any) => {};
                },
                hasAccount: (_: string) => Promise.resolve(true),
                getMessages: () => Promise.resolve([]),
                getIdEnsName: async (ensName: string) => ensName,
            };
            const app = express();
            app.use(bodyParser.json());
            app.use(delivery(web3Provider as any, db as any, serverSecret));

            const { status } = await request(app)
                .get('/messages/alice.eth/contact/bob.eth')
                .set({
                    authorization: `Bearer ${token}`,
                })

                .send();

            expect(status).toBe(200);
        });
    });

    describe('syncAcknoledgment', () => {
        it('Returns 200 if schema is valid', async () => {
            const web3Provider = {
                resolveName: async () =>
                    '0x99C19AB10b9EC8aC6fcda9586E81f6B73a298870',
            };

            const token = await createAuthToken(
                '0x99C19AB10b9EC8aC6fcda9586E81f6B73a298870',
            );

            const db = {
                ...(await getDatabase(redisClient)),
                getAccount: async (ensName: string) => ({
                    challenge: '123',
                    token,
                }),
                setAccount: async (_: string, __: any) => {
                    return (_: any, __: any, ___: any) => {};
                },
                hasAccount: (_: string) => Promise.resolve(true),
                getIdEnsName: async (ensName: string) => ensName,
            };
            const app = express();
            app.use(bodyParser.json());
            app.use(delivery(web3Provider as any, db as any, serverSecret));

            const { status } = await request(app)
                .post(
                    '/messages/0x99C19AB10b9EC8aC6fcda9586E81f6B73a298870/syncAcknowledgements',
                )
                .set({
                    authorization: `Bearer ${token}`,
                })

                .send({
                    acknowledgements: [
                        {
                            contactAddress:
                                '0x99C19AB10b9EC8aC6fcda9586E81f6B73a298870',
                            messageHash: '12345',
                        },
                    ],
                });

            expect(status).toBe(200);
        });

        it('Returns 400 if body is invalid', async () => {
            const web3Provider = {
                resolveName: async () =>
                    '0x99C19AB10b9EC8aC6fcda9586E81f6B73a298870',
            };

            const token = await createAuthToken(
                '0x99C19AB10b9EC8aC6fcda9586E81f6B73a298870',
            );
            const db = {
                ...(await getDatabase(redisClient)),
                getAccount: async (ensName: string) => ({
                    challenge: '123',
                    token,
                }),
                setAccount: async (_: string, __: any) => {
                    return (_: any, __: any, ___: any) => {};
                },
                hasAccount: (_: string) => Promise.resolve(true),
                getIdEnsName: async (ensName: string) => ensName,
            };

            const app = express();
            app.use(bodyParser.json());
            app.use(delivery(web3Provider as any, db as any, serverSecret));

            const { status } = await request(app)
                .post(
                    '/messages/0x99C19AB10b9EC8aC6fcda9586E81f6B73a298870/syncAcknowledgements',
                )
                .set({
                    authorization: `Bearer ${token}`,
                })

                .send({
                    foo: 'bar',
                });

            expect(status).toBe(400);
        });
    });
});

const createAuthToken = async (ensName: string) => {
    return generateAuthJWT(ensName, serverSecret);
};
