import { normalizeEnsName, UserProfile } from '@dm3-org/dm3-lib-profile';
import {
    ethersHelper,
    IWebSocketManager,
    stringify,
} from '@dm3-org/dm3-lib-shared';
import {
    getMockDeliveryServiceProfile,
    MockDeliveryServiceProfile,
    MockedUserProfile,
    MockMessageFactory,
    mockUserProfile,
} from '@dm3-org/dm3-lib-test-helper';
import { Axios } from 'axios';
import bodyParser from 'body-parser';
import { ethers } from 'ethers';
import express from 'express';
import request from 'supertest';

import RpcProxy from './rpc-proxy';
import { EncryptionEnvelop } from '@dm3-org/dm3-lib-messaging';

const mockWsManager: IWebSocketManager = {
    isConnected: function (ensName: string): Promise<boolean> {
        return Promise.resolve(false);
    },
};

const RECEIVER_NAME = 'alice.eth';
const SENDER_NAME = 'bob.eth';

describe('rpc-Proxy', () => {
    let sender: MockedUserProfile;
    let receiver: MockedUserProfile;
    let ds: MockDeliveryServiceProfile;

    beforeEach(async () => {
        const receiverWallet = ethers.Wallet.createRandom();
        sender = await mockUserProfile(
            ethers.Wallet.createRandom(),
            SENDER_NAME,
            ['http://localhost:3000'],
        );
        receiver = await mockUserProfile(receiverWallet, RECEIVER_NAME, [
            'http://localhost:3000',
        ]);
        ds = await getMockDeliveryServiceProfile(
            ethers.Wallet.createRandom(),
            'http://localhost:3000',
        );
    });

    const getAccount = async (address: string) => {
        const emptyProfile: UserProfile = {
            publicSigningKey: '',
            publicEncryptionKey: '',
            deliveryServices: [''],
        };

        const isSender = ethersHelper.formatAddress(address) === sender.address;
        const isReceiver =
            ethersHelper.formatAddress(address) === receiver.address;

        const account = (
            account: string,
            token: string,
            profile: UserProfile,
        ) => ({
            account,
            signedUserProfile: {
                profile,
                signature: '',
            },
            token,
        });

        if (isSender) {
            return account(sender.address, '123', emptyProfile);
        }

        if (isReceiver) {
            return account(RECEIVER_NAME, 'abc', {
                ...emptyProfile,
                publicEncryptionKey:
                    receiver.profileKeys.encryptionKeyPair.publicKey,
            });
        }

        return null;
    };

    describe('routing', () => {
        it('Should block non-dm3 related requests', async () => {
            const app = express();
            app.use(bodyParser.json());
            app.use(
                RpcProxy(
                    {} as any,
                    {} as any,
                    {} as any,
                    {} as any,
                    {} as any,
                    ds.keys,
                    mockWsManager,
                ),
            );

            const { status, body } = await request(app)
                .post('/')
                .send({
                    jsonrpc: '2.0',
                    method: 'eth_getBlockByHash',
                    params: [
                        '0xdc0818cf78f21a8e70579cb46a43643f78291264dda342ae31049421c82d21ae',
                        false,
                    ],
                    id: 1,
                });

            expect(body).toStrictEqual({ error: 'Method not allowed' });
            expect(status).toBe(405);

            return;
        });
        it('Should handle dm3_submitMessage with authentication', async () => {
            const mockPost = jest.fn((url: string, body: any) => {
                return Promise.reject('Should not have been invoked');
            });
            const axiosMock = {
                post: mockPost,
            } as Partial<Axios>;

            process.env.SIGNING_PUBLIC_KEY = ds.keys.signingKeyPair.publicKey;
            process.env.SIGNING_PRIVATE_KEY = ds.keys.signingKeyPair.privateKey;
            process.env.ENCRYPTION_PUBLIC_KEY =
                ds.keys.encryptionKeyPair.publicKey;
            process.env.ENCRYPTION_PRIVATE_KEY =
                ds.keys.encryptionKeyPair.privateKey;
            const deliveryServiceProperties = {
                sizeLimit: 2 ** 14,
                notificationChannel: [],
            };

            const web3Provider = {
                resolveName: async (name: string) => {
                    if (name === 'alice.eth') {
                        return receiver.address;
                    }
                },
            } as any;

            const db = {
                createMessage: () => {},
                getAccount,
                getIdEnsName: async (ensName: string) => ensName,
                getUsersNotificationChannels: () => Promise.resolve([]),
                countMessage: () => {},
            };
            const io = {
                sockets: {
                    to: (_: any) => ({
                        emit: (_: any, __any: any) => {},
                    }),
                },
            };

            const app = express();
            app.use(bodyParser.json());
            app.use(
                RpcProxy(
                    axiosMock as Axios,
                    deliveryServiceProperties as any,
                    io as any,
                    web3Provider as any,
                    db as any,
                    ds.keys,
                    mockWsManager,
                ),
            );

            const envelop: EncryptionEnvelop = await MockMessageFactory(
                sender,
                receiver,
                ds,
            ).createEncryptedEnvelop('hello dm3');

            const { status } = await request(app)
                .post('/')
                .send({
                    jsonrpc: '2.0',
                    method: 'dm3_submitMessage',
                    params: [JSON.stringify(envelop), '123'],
                });

            expect(mockPost).not.toBeCalled();
            expect(status).toBe(200);
        });

        it('Should handle dm3_submitMessage without authentication', async () => {
            const mockPost = jest.fn((url: string, body: any) => {
                return Promise.reject('Should not have been invoked');
            });
            const axiosMock = {
                post: mockPost,
            } as Partial<Axios>;

            process.env.SIGNING_PUBLIC_KEY = ds.keys.signingKeyPair.publicKey;
            process.env.SIGNING_PRIVATE_KEY = ds.keys.signingKeyPair.privateKey;
            process.env.ENCRYPTION_PUBLIC_KEY =
                ds.keys.encryptionKeyPair.publicKey;
            process.env.ENCRYPTION_PRIVATE_KEY =
                ds.keys.encryptionKeyPair.privateKey;

            const deliveryServiceProperties = {
                sizeLimit: 2 ** 14,
                notificationChannel: [],
            };

            const web3Provider = {
                resolveName: async (name: string) => {
                    if (name === 'alice.eth') {
                        return receiver.address;
                    }
                },
            } as any;
            const db = {
                createMessage: () => {},
                getAccount,
                getIdEnsName: async (ensName: string) => ensName,
                getUsersNotificationChannels: () => Promise.resolve([]),
                countMessage: () => {},
            };
            const io = {
                sockets: {
                    to: (_: any) => ({
                        emit: (_: any, __any: any) => {},
                    }),
                },
            };

            const app = express();
            app.use(bodyParser.json());
            app.use(
                RpcProxy(
                    axiosMock as Axios,
                    deliveryServiceProperties as any,
                    io as any,
                    web3Provider as any,
                    db as any,
                    ds.keys,
                    mockWsManager,
                ),
            );
            const envelop: EncryptionEnvelop = await MockMessageFactory(
                sender,
                receiver,
                ds,
            ).createEncryptedEnvelop('hello dm3');

            const { status } = await request(app)
                .post('/')
                .send({
                    jsonrpc: '2.0',
                    method: 'dm3_submitMessage',
                    params: [JSON.stringify(envelop)],
                });

            expect(mockPost).not.toBeCalled();
            expect(status).toBe(200);
        });

        it('Should handle dm3_getDeliveryServiceProperties', async () => {
            const mockPost = jest.fn((url: string, body: any) => {
                return Promise.reject('Should not have been invoked');
            });
            const axiosMock = {
                post: mockPost,
            } as Partial<Axios>;

            const deliveryServiceProperties = {
                messageTTL: 0,
                sizeLimit: 0,
                notificationChannel: [],
            };

            const app = express();
            app.use(bodyParser.json());
            app.use(
                RpcProxy(
                    axiosMock as Axios,
                    deliveryServiceProperties as any,
                    {} as any,
                    {} as any,
                    {} as any,
                    ds.keys,
                    {} as any,
                ),
            );

            const { status, body } = await request(app).post('/').send({
                jsonrpc: '2.0',
                method: 'dm3_getDeliveryServiceProperties',
                params: [],
            });

            expect(mockPost).not.toBeCalled();
            expect(status).toBe(200);
            expect(body).toEqual({
                jsonrpc: '2.0',
                result: JSON.stringify({
                    messageTTL: 0,
                    notificationChannel: [],
                    sizeLimit: 0,
                }),
            });
        });

        it('Should return 400 if method is undefined', async () => {
            const mockPost = jest.fn((url: string, body: any) => {
                return Promise.reject('Should not have been invoked');
            });
            const axiosMock = {
                post: mockPost,
            } as Partial<Axios>;

            const app = express();
            app.use(bodyParser.json());
            app.use(
                RpcProxy(
                    axiosMock as Axios,
                    {} as any,
                    {} as any,
                    {} as any,
                    {} as any,
                    ds.keys,
                    mockWsManager,
                ),
            );

            const { status } = await request(app).post('/');

            expect(mockPost).not.toBeCalled();
            expect(status).toBe(400);

            return;
        });
    });

    describe('resolveProfileExtension', () => {
        it('return 400 if user is unknown', async () => {
            const mockPost = jest.fn((url: string, body: any) => {
                return Promise.reject('Should not have been invoked');
            });
            const axiosMock = {
                post: mockPost,
            } as Partial<Axios>;

            const web3Provider = {
                resolveName: (_: string) => Promise.resolve(RECEIVER_NAME),
            };
            const db = {
                getIdEnsName: async (ensName: string) => ensName,
                getAccount: (_: string) => Promise.resolve(null),
                getUsersNotificationChannels: () => Promise.resolve([]),
            };

            const app = express();
            app.use(bodyParser.json());
            app.use(
                RpcProxy(
                    axiosMock as Axios,
                    {} as any,
                    {} as any,
                    web3Provider as any,
                    db as any,
                    ds.keys,
                    mockWsManager,
                ),
            );

            const { status, body } = await request(app)
                .post('/')
                .send({
                    jsonrpc: '2.0',
                    method: 'dm3_getProfileExtension',
                    params: ['unknown.eth'],
                });

            expect(mockPost).not.toBeCalled();
            expect(status).toBe(400);
            expect(body).toStrictEqual({
                error: 'unknown user',
            });
        });

        it('return 200 and the profileExtension', async () => {
            const mockPost = jest.fn((url: string, body: any) => {
                return Promise.reject('Should not have been invoked');
            });
            const axiosMock = {
                post: mockPost,
            } as Partial<Axios>;

            const web3Provider = {
                resolveName: (_: string) => Promise.resolve(RECEIVER_NAME),
            };
            const db = {
                getIdEnsName: async (ensName: string) => ensName,
                getAccount: (_: string) =>
                    Promise.resolve({
                        account: '',
                        signedUserProfile: {
                            profile: {
                                publicEncryptionKey: '',
                                publicSigningKey: '',
                                deliveryServices: '',
                            },
                            signature: '',
                        },
                        token: '',
                        publicMessageHeadUri: '',
                        createdAt: 0,
                        socketId: '',
                        challenge: '',
                        profileExtension: {
                            notSupportedMessageTypes: ['NEW'],
                        },
                    }),
                getUsersNotificationChannels: () => Promise.resolve([]),
            };

            const app = express();
            app.use(bodyParser.json());
            app.use(
                RpcProxy(
                    axiosMock as Axios,
                    {} as any,
                    {} as any,
                    web3Provider as any,
                    db as any,
                    ds.keys,
                    mockWsManager,
                ),
            );

            const { status, body } = await request(app)
                .post('/')
                .send({
                    jsonrpc: '2.0',
                    method: 'dm3_getProfileExtension',
                    params: ['unknown.eth'],
                });

            expect(mockPost).not.toBeCalled();
            expect(status).toBe(200);
            expect(body).toStrictEqual({
                jsonrpc: '2.0',
                result: stringify({
                    notSupportedMessageTypes: ['NEW'],
                }),
            });
        });
    });
});
