import bodyParser from 'body-parser';
import express from 'express';
import request from 'supertest';
import auth from './auth';
import delivery from './delivery';
import winston from 'winston';

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

global.logger = winston.createLogger({
    transports: [new winston.transports.Console()],
});
describe('Delivery', () => {
    describe('getMessages', () => {
        it('Returns 200 if schema is valid', async () => {
            const app = express();
            app.use(bodyParser.json());
            app.use(delivery());
            (app.locals.web3Provider = {
                resolveName: async () =>
                    '0x99C19AB10b9EC8aC6fcda9586E81f6B73a298870',
            }),
                (app.locals.keys = {
                    signing: keysA.signingKeyPair,
                    encryption: keysA.encryptionKeyPair,
                }),
                (app.locals.redisClient = {
                    exists: (_: any) => false,
                });

            const token = await createAuthToken();

            app.locals.db = {
                getSession: async (ensName: string) =>
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
                setSession: async (_: string, __: any) => {
                    return (_: any, __: any, ___: any) => {};
                },
                getMessages: () => Promise.resolve([]),
                getIdEnsName: async (ensName: string) => ensName,
            };

            const { status } = await request(app)
                .get('/messages/alice.eth/contact/bob.eth')
                .set({
                    authorization: `Bearer ${token}`,
                })

                .send();

            expect(status).toBe(200);
        });
    });

    describe('getPendingMessages', () => {
        it('Returns 200 if schema is valid', async () => {
            const app = express();
            app.use(bodyParser.json());
            app.use(delivery());

            app.locals.redisClient = {
                exists: (_: any) => false,
                sMembers: (_: any) => [],
                del: (_: any) => {},
            };
            app.locals.web3Provider = {
                resolveName: async () =>
                    '0x99C19AB10b9EC8aC6fcda9586E81f6B73a298870',
            };

            const token = await createAuthToken();

            app.locals.db = {
                getSession: async (ensName: string) => ({
                    challenge: '123',
                    token,
                }),
                setSession: async (_: string, __: any) => {
                    return (_: any, __: any, ___: any) => {};
                },
                getPending: (_: any) => [],
                deletePending: (_: any) => [],
                getIdEnsName: async (ensName: string) => ensName,
            };

            const { status } = await request(app)
                .post(
                    '/messages/0x99C19AB10b9EC8aC6fcda9586E81f6B73a298870/pending',
                )
                .set({
                    authorization: `Bearer ${token}`,
                })

                .send();

            expect(status).toBe(200);
        });
    });

    describe('syncAcknoledgment', () => {
        it('Returns 200 if schema is valid', async () => {
            const app = express();
            app.use(bodyParser.json());
            app.use(delivery());

            app.locals.redisClient = {
                exists: (_: any) => false,
                sMembers: (_: any) => [],
                del: (_: any) => {},
                hSet: (_: any, __: any, ___: any) => {},
                hGetAll: () => ['123', '456'],
                zRemRangeByScore: (_: any, __: any, ___: any) => 0,
            };
            app.locals.web3Provider = {
                resolveName: async () =>
                    '0x99C19AB10b9EC8aC6fcda9586E81f6B73a298870',
            };

            const token = await createAuthToken();

            app.locals.db = {
                getSession: async (ensName: string) => ({
                    challenge: '123',
                    token,
                }),
                setSession: async (_: string, __: any) => {
                    return (_: any, __: any, ___: any) => {};
                },
                getIdEnsName: async (ensName: string) => ensName,
                syncAcknowledge: async (
                    conversationId: string,
                    lastMessagePull: string,
                ) => Promise<void>,
            };

            const { status } = await request(app)
                .post(
                    '/messages/0x99C19AB10b9EC8aC6fcda9586E81f6B73a298870/syncAcknoledgment/12345',
                )
                .set({
                    authorization: `Bearer ${token}`,
                })

                .send({
                    acknoledgments: [
                        {
                            contactAddress:
                                '0x99C19AB10b9EC8aC6fcda9586E81f6B73a298870',
                            messageDeliveryServiceTimestamp: 123,
                        },
                    ],
                });

            expect(status).toBe(200);
        });
        it('Returns 400 if params are invalid', async () => {
            const app = express();
            app.use(bodyParser.json());
            app.use(delivery());

            app.locals.redisClient = {
                exists: (_: any) => false,
                sMembers: (_: any) => [],
                del: (_: any) => {},
            };
            app.locals.web3Provider = {
                resolveName: async () =>
                    '0x99C19AB10b9EC8aC6fcda9586E81f6B73a298870',
            };

            const token = await createAuthToken();

            app.locals.db = {
                getSession: async (ensName: string) => ({
                    challenge: '123',
                    token,
                }),
                setSession: async (_: string, __: any) => {
                    return (_: any, __: any, ___: any) => {};
                },
                getIdEnsName: async (ensName: string) => ensName,
            };

            const { status } = await request(app)
                .post(
                    '/messages/0x99C19AB10b9EC8aC6fcda9586E81f6B73a298870/syncAcknoledgment/fooo',
                )
                .set({
                    authorization: `Bearer ${token}`,
                })

                .send({
                    acknoledgments: [],
                });

            expect(status).toBe(400);
        });
        it('Returns 400 if body is invalid', async () => {
            const app = express();
            app.use(bodyParser.json());
            app.use(delivery());

            app.locals.redisClient = {
                exists: (_: any) => false,
                sMembers: (_: any) => [],
                del: (_: any) => {},
            };
            app.locals.web3Provider = {
                resolveName: async () =>
                    '0x99C19AB10b9EC8aC6fcda9586E81f6B73a298870',
            };

            const token = await createAuthToken();

            app.locals.db = {
                getSession: async (ensName: string) => ({
                    challenge: '123',
                    token,
                }),
                setSession: async (_: string, __: any) => {
                    return (_: any, __: any, ___: any) => {};
                },
                getIdEnsName: async (ensName: string) => ensName,
            };

            const { status } = await request(app)
                .post(
                    '/messages/0x99C19AB10b9EC8aC6fcda9586E81f6B73a298870/syncAcknoledgment/1234',
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

const createAuthToken = async () => {
    const app = express();
    app.use(bodyParser.json());
    app.use(auth());

    app.locals.redisClient = {
        exists: (_: any) => false,
    };

    app.locals.db = {
        getSession: async (ensName: string) => ({
            challenge: 'my-Challenge',
            signedUserProfile: {
                profile: {
                    publicSigningKey: keysA.signingKeyPair.publicKey,
                },
            },
        }),
        setSession: async (_: string, __: any) => {
            return (_: any, __: any, ___: any) => {};
        },
        getIdEnsName: async (ensName: string) => ensName,
    };

    const signature =
        '3A893rTBPEa3g9FL2vgDreY3vvXnOiYCOoJURNyctncwH' +
        '0En/mcwo/t2v2jtQx/pcnOpTzuJwLuZviTQjd9vBQ==';

    const { body } = await request(app)
        .post(`/0x71CB05EE1b1F506fF321Da3dac38f25c0c9ce6E1`)
        .send({
            signature,
        });

    return body.token;
};
