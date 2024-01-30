import bodyParser from 'body-parser';
import express from 'express';
import auth from './auth';
import request from 'supertest';
import notifications from './notifications';
import { NotificationChannelType } from '@dm3-org/dm3-lib-delivery';

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

describe('Notifications', () => {
    describe('get NotificationChannels', () => {
        it('Returns empty array as global notification is turned off', async () => {
            const app = express();
            app.use(bodyParser.json());
            app.use(notifications());

            const token = await createAuthToken();

            app.locals.db = {
                getSession: async (ensName: string) =>
                    Promise.resolve({
                        challenge: '123',
                        token,
                        signedUserProfile: {
                            profile: {
                                publicSigningKey:
                                    keysA.signingKeyPair.publicKey,
                            },
                        },
                    }),
                setSession: async (_: string, __: any) => {
                    return (_: any, __: any, ___: any) => {};
                },
                getUserStorage: async (addr: string) => {
                    return {};
                },
                getIdEnsName: async (ensName: string) => ensName,
                getGlobalNotification: async (ensName: string) =>
                    Promise.resolve({ isEnabled: false }),
                getUsersNotificationChannels: async (ensName: string) =>
                    Promise.resolve([]),
            };

            app.locals.web3Provider = {
                resolveName: async () =>
                    '0x71CB05EE1b1F506fF321Da3dac38f25c0c9ce6E1',
            };
            const { status, body } = await request(app)
                .get(`/bob.eth`)
                .set({
                    authorization: `Bearer ${token}`,
                })
                .send();

            expect(status).toBe(200);
            expect(body).toEqual({
                notificationChannels: [],
            });
        });

        it('Returns 200 with empty notification channels as global notification is turned on', async () => {
            const app = express();
            app.use(bodyParser.json());
            app.use(notifications());

            const token = await createAuthToken();

            app.locals.db = {
                getSession: async (ensName: string) =>
                    Promise.resolve({
                        challenge: '123',
                        token,
                        signedUserProfile: {
                            profile: {
                                publicSigningKey:
                                    keysA.signingKeyPair.publicKey,
                            },
                        },
                    }),
                setSession: async (_: string, __: any) => {
                    return (_: any, __: any, ___: any) => {};
                },
                getUserStorage: async (addr: string) => {
                    return {};
                },
                getIdEnsName: async (ensName: string) => ensName,
                getUsersNotificationChannels: async (ensName: string) =>
                    Promise.resolve([]),
                getGlobalNotification: async (ensName: string) =>
                    Promise.resolve({ isEnabled: true }),
            };

            app.locals.web3Provider = {
                resolveName: async () =>
                    '0x71CB05EE1b1F506fF321Da3dac38f25c0c9ce6E1',
            };
            const { status, body } = await request(app)
                .get(`/bob.eth`)
                .set({
                    authorization: `Bearer ${token}`,
                })
                .send();

            expect(status).toBe(200);
            expect(body).toEqual({
                notificationChannels: [],
            });
        });
    });

    describe('setUserStorage', () => {
        it('Returns 400 on setup email notifications as email ID is invalid', async () => {
            const app = express();
            app.use(bodyParser.json());
            app.use(notifications());

            const token = await createAuthToken();
            const addUsersNotificationChannelMock = jest.fn();

            app.locals.db = {
                getSession: async (ensName: string) =>
                    Promise.resolve({
                        challenge: '123',
                        token,
                    }),
                setSession: async (_: string, __: any) => {
                    return (_: any, __: any, ___: any) => {};
                },
                setUserStorage: (_: string, __: string) => {},
                getIdEnsName: async (ensName: string) => ensName,
                addUsersNotificationChannel: addUsersNotificationChannelMock,
            };

            app.locals.web3Provider = {
                resolveName: async () =>
                    '0x71CB05EE1b1F506fF321Da3dac38f25c0c9ce6E1',
            };

            const { status } = await request(app)
                .post(`/bob.eth`)
                .set({
                    authorization: `Bearer ${token}`,
                })
                .send({
                    recipientValue: 'bob.eth',
                    notificationChannelType: NotificationChannelType.EMAIL,
                });

            expect(status).toBe(400);
        });

        it('Returns 400 on setup email notifications as notificationChannelType is invalid', async () => {
            const app = express();
            app.use(bodyParser.json());
            app.use(notifications());

            const token = await createAuthToken();
            const addUsersNotificationChannelMock = jest.fn();

            app.locals.db = {
                getSession: async (ensName: string) =>
                    Promise.resolve({
                        challenge: '123',
                        token,
                    }),
                setSession: async (_: string, __: any) => {
                    return (_: any, __: any, ___: any) => {};
                },
                setUserStorage: (_: string, __: string) => {},
                getIdEnsName: async (ensName: string) => ensName,
                addUsersNotificationChannel: addUsersNotificationChannelMock,
            };

            app.locals.web3Provider = {
                resolveName: async () =>
                    '0x71CB05EE1b1F506fF321Da3dac38f25c0c9ce6E1',
            };

            const { status } = await request(app)
                .post(`/bob.eth`)
                .set({
                    authorization: `Bearer ${token}`,
                })
                .send({
                    recipientValue: 'bob@gamil.com',
                    notificationChannelType: '',
                });

            expect(status).toBe(400);
        });

        it('Returns 400 on setup email notifications as globalNotifications is turned off', async () => {
            const app = express();
            app.use(bodyParser.json());
            app.use(notifications());

            const token = await createAuthToken();
            const addUsersNotificationChannelMock = jest.fn();

            app.locals.db = {
                getSession: async (ensName: string) =>
                    Promise.resolve({
                        challenge: '123',
                        token,
                    }),
                setSession: async (_: string, __: any) => {
                    return (_: any, __: any, ___: any) => {};
                },
                setUserStorage: (_: string, __: string) => {},
                getIdEnsName: async (ensName: string) => ensName,
                getGlobalNotification: async (ensName: string) =>
                    Promise.resolve({ isEnabled: false }),
                addUsersNotificationChannel: addUsersNotificationChannelMock,
            };

            app.locals.web3Provider = {
                resolveName: async () =>
                    '0x71CB05EE1b1F506fF321Da3dac38f25c0c9ce6E1',
            };

            const { status } = await request(app)
                .post(`/bob.eth`)
                .set({
                    authorization: `Bearer ${token}`,
                })
                .send({
                    recipientValue: 'bob@gamil.com',
                    notificationChannelType: NotificationChannelType.EMAIL,
                });

            expect(status).toBe(400);
        });

        it('User can setup email notifications', async () => {
            const app = express();
            app.use(bodyParser.json());
            app.use(notifications());

            const token = await createAuthToken();

            const addUsersNotificationChannelMock = jest.fn();

            app.locals.db = {
                getSession: async (ensName: string) =>
                    Promise.resolve({
                        challenge: '123',
                        token,
                    }),
                setSession: async (_: string, __: any) => {
                    return (_: any, __: any, ___: any) => {};
                },
                setUserStorage: (_: string, __: string) => {},
                getIdEnsName: async (ensName: string) => ensName,
                getGlobalNotification: async (ensName: string) =>
                    Promise.resolve({ isEnabled: true }),
                addUsersNotificationChannel: addUsersNotificationChannelMock,
            };
            app.locals.web3Provider = {
                resolveName: async () =>
                    '0x71CB05EE1b1F506fF321Da3dac38f25c0c9ce6E1',
            };

            const { status, body } = await request(app)
                .post(`/bob.eth`)
                .set({
                    authorization: `Bearer ${token}`,
                })
                .send({
                    recipientValue: 'bob@gmail.com',
                    notificationChannelType: NotificationChannelType.EMAIL,
                });

            expect(status).toBe(200);
            expect(addUsersNotificationChannelMock).toHaveBeenCalledWith(
                'bob.eth',
                {
                    type: 'EMAIL',
                    config: {
                        recipientValue: 'bob@gmail.com',
                    },
                },
            );
        });
    });

    describe('Get Global Notification', () => {
        it('Returns 200 and false as global notification is not enabled', async () => {
            const app = express();
            app.use(bodyParser.json());
            app.use(notifications());

            const token = await createAuthToken();

            app.locals.db = {
                getSession: async (ensName: string) =>
                    Promise.resolve({
                        challenge: '123',
                        token,
                        signedUserProfile: {
                            profile: {
                                publicSigningKey:
                                    keysA.signingKeyPair.publicKey,
                            },
                        },
                    }),
                setSession: async (_: string, __: any) => {
                    return (_: any, __: any, ___: any) => {};
                },
                getUserStorage: async (addr: string) => {
                    return {};
                },
                getIdEnsName: async (ensName: string) => ensName,
                getGlobalNotification: async (ensName: string) =>
                    Promise.resolve({
                        isEnabled: false,
                    }),
            };

            app.locals.web3Provider = {
                resolveName: async () =>
                    '0x71CB05EE1b1F506fF321Da3dac38f25c0c9ce6E1',
            };
            const { status, body } = await request(app)
                .get(`/global/bob.eth`)
                .set({
                    authorization: `Bearer ${token}`,
                })
                .send();

            expect(status).toBe(200);
            expect(body).toEqual({
                isEnabled: false,
            });
        });
    });

    describe('Set Global Notification', () => {
        it('Enable global notifications', async () => {
            const app = express();
            app.use(bodyParser.json());
            app.use(notifications());

            const token = await createAuthToken();

            const setGlobalNotificationMock = jest.fn();

            app.locals.db = {
                getSession: async (ensName: string) =>
                    Promise.resolve({
                        challenge: '123',
                        token,
                    }),
                setSession: async (_: string, __: any) => {
                    return (_: any, __: any, ___: any) => {};
                },
                setUserStorage: (_: string, __: string) => {},
                getIdEnsName: async (ensName: string) => ensName,
                setGlobalNotification: setGlobalNotificationMock,
            };
            app.locals.web3Provider = {
                resolveName: async () =>
                    '0x71CB05EE1b1F506fF321Da3dac38f25c0c9ce6E1',
            };

            const { status } = await request(app)
                .post(`/global/bob.eth`)
                .set({
                    authorization: `Bearer ${token}`,
                })
                .send({
                    isEnabled: true,
                });

            expect(status).toBe(200);
            expect(setGlobalNotificationMock).toHaveBeenCalledWith('bob.eth', {
                isEnabled: true,
            });
        });

        it('Disable global notifications', async () => {
            const app = express();
            app.use(bodyParser.json());
            app.use(notifications());

            const token = await createAuthToken();

            const setGlobalNotificationMock = jest.fn();

            app.locals.db = {
                getSession: async (ensName: string) =>
                    Promise.resolve({
                        challenge: '123',
                        token,
                    }),
                setSession: async (_: string, __: any) => {
                    return (_: any, __: any, ___: any) => {};
                },
                setUserStorage: (_: string, __: string) => {},
                getIdEnsName: async (ensName: string) => ensName,
                setGlobalNotification: setGlobalNotificationMock,
            };
            app.locals.web3Provider = {
                resolveName: async () =>
                    '0x71CB05EE1b1F506fF321Da3dac38f25c0c9ce6E1',
            };

            const { status } = await request(app)
                .post(`/global/bob.eth`)
                .set({
                    authorization: `Bearer ${token}`,
                })
                .send({
                    isEnabled: false,
                });

            expect(status).toBe(200);
            expect(setGlobalNotificationMock).toHaveBeenCalledWith('bob.eth', {
                isEnabled: false,
            });
        });

        it('Returns 400 if req.body is invalid', async () => {
            const app = express();
            app.use(bodyParser.json());
            app.use(notifications());

            const token = await createAuthToken();

            const setGlobalNotificationMock = jest.fn();

            app.locals.db = {
                getSession: async (ensName: string) =>
                    Promise.resolve({
                        challenge: '123',
                        token,
                    }),
                setSession: async (_: string, __: any) => {
                    return (_: any, __: any, ___: any) => {};
                },
                setUserStorage: (_: string, __: string) => {},
                getIdEnsName: async (ensName: string) => ensName,
                setGlobalNotification: setGlobalNotificationMock,
            };
            app.locals.web3Provider = {
                resolveName: async () =>
                    '0x71CB05EE1b1F506fF321Da3dac38f25c0c9ce6E1',
            };

            const { status } = await request(app)
                .post(`/global/bob.eth`)
                .set({
                    authorization: `Bearer ${token}`,
                })
                .send({
                    isEnabled: '',
                });

            expect(status).toBe(400);
        });
    });
});

const createAuthToken = async () => {
    const app = express();
    app.use(bodyParser.json());
    app.use(auth());

    app.locals = {
        web3Provider: {
            resolveName: async () =>
                '0x71CB05EE1b1F506fF321Da3dac38f25c0c9ce6E1',
        },
        redisClient: {
            exists: (_: any) => false,
        },
    };

    app.locals.db = {
        getSession: async (accountAddress: string) =>
            Promise.resolve({
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

    const { body } = await request(app).post(`/bob.eth`).send({
        signature,
    });

    return body.token;
};
