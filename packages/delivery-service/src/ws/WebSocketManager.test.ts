import { io as Client } from 'socket.io-client';
import { Server as SocketIoServer } from 'socket.io';
import { createServer, Server as HttpServerType } from 'http';
import { AUTHORIZED, UNAUTHORIZED, WebSocketManager } from './WebSocketManager';
import { generateAuthJWT } from '@dm3-org/dm3-lib-server-side';
import {
    getMockDeliveryServiceProfile,
    MockDeliveryServiceProfile,
    MockedUserProfile,
    mockUserProfile,
} from '@dm3-org/dm3-lib-test-helper';
import { ethers } from 'ethers';
import account from '../persistence/account';

const serverSecret = 'verySecretAndImportantServerSecret';
describe('WebSocketManager', () => {
    let client0;
    let client1;
    let client2;
    let httpServer;
    let socketIoServer;

    let sender: MockedUserProfile;
    let receiver: MockedUserProfile;
    let receiverOnGno: MockedUserProfile;
    let rando: MockedUserProfile;

    let ds: MockDeliveryServiceProfile;

    beforeEach(async () => {
        httpServer = await mockHttpServer(4060);
        socketIoServer = new SocketIoServer(httpServer, {
            cors: {
                origin: '*',
                methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
                preflightContinue: false,
                optionsSuccessStatus: 204,
            },
        });

        //The receiver might use the same address for different networks. Hence we keep the wallet separate

        const receiverWallet = ethers.Wallet.createRandom();
        sender = await mockUserProfile(
            ethers.Wallet.createRandom(),
            'bob.eth',
            ['http://localhost:3000'],
        );
        receiver = await mockUserProfile(receiverWallet, 'alice.eth', [
            'http://localhost:3000',
        ]);
        receiverOnGno = await mockUserProfile(receiverWallet, 'alice.gno', [
            'http://localhost:3000',
        ]);
        rando = await mockUserProfile(
            ethers.Wallet.createRandom(),
            'rando.eth',
            ['http://localhost:3000'],
        );

        ds = await getMockDeliveryServiceProfile(
            ethers.Wallet.createRandom(),
            'http://localhost:3000',
        );
    });

    afterEach(() => {
        httpServer.close();
        if (client0) client0.close();
        if (client1) client1.close();
        if (client2) client2.close();
    });

    describe('Connect', () => {
        it('reject socket with token or ensName', async () => {
            const mockedWeb3Provider = {} as any;
            const mockedDatabase = {} as any;

            new WebSocketManager(
                socketIoServer,
                mockedWeb3Provider,
                mockedDatabase,
                serverSecret,
            );
            client0 = await Client('http://localhost:4060');

            const [socket0IsConnected] = await Promise.all([
                new Promise((res, rej) => {
                    client0.on(UNAUTHORIZED, (err: any) => {
                        res(false);
                    });
                }),
            ]);

            expect(socket0IsConnected).toBe(false);
        });
        it('reject socket without account', async () => {
            const mockedWeb3Provider = {
                resolveName: (_: string) => Promise.resolve('0x'),
            } as any;
            const mockedDatabase = {
                getAccount: () => Promise.resolve(null),
            } as any;

            client0 = await Client('http://localhost:4060', {
                auth: {
                    account: {
                        ensName: 'bob.eth',
                    },
                    token: generateAuthJWT('bob.eth', serverSecret),
                },
            });

            new WebSocketManager(
                socketIoServer,
                mockedWeb3Provider,
                mockedDatabase,
                serverSecret,
            );

            const [socket0IsConnected] = await Promise.all([
                new Promise((res, rej) => {
                    client0.on(UNAUTHORIZED, (err: any) => {
                        res(false);
                    });
                }),
            ]);

            expect(socket0IsConnected).toBe(false);
        });
        it('connects authorized socket', async () => {
            const mockedWeb3Provider = {
                resolveName: (_: string) => Promise.resolve('0x123'),
            } as any;

            const mockedDatabase = {
                getAccount: () =>
                    Promise.resolve({
                        token: 'token',
                        createdAt: new Date().getTime(),
                    }),
                hasAccount: (_: string) => Promise.resolve(true),
            } as any;

            new WebSocketManager(
                socketIoServer,
                mockedWeb3Provider,
                mockedDatabase,
                serverSecret,
            );

            client0 = await Client('http://localhost:4060', {
                auth: {
                    account: {
                        ensName: 'bob.eth',
                    },
                    token: generateAuthJWT('bob.eth', serverSecret),
                },
            });

            const [socket0IsConnected] = await Promise.all([
                new Promise((res, rej) => {
                    client0.on(UNAUTHORIZED, (err: any) => {
                        rej();
                    });
                    client0.on(AUTHORIZED, (err: any) => {
                        res(true);
                    });
                }),
            ]);

            expect(socket0IsConnected).toBe(true);
        });
    });
    describe('isConnected', () => {
        it('returns true if name has one account', async () => {
            const mockedWeb3Provider = {
                resolveName: (_: string) => Promise.resolve(receiver.address),
            } as any;

            const mockedDatabase = {
                getAccount: () =>
                    Promise.resolve({
                        account: receiver.address,
                        token: 'old token that is not used anymore',
                        createdAt: new Date().getTime(),
                    }),
                hasAccount: (_: string) => Promise.resolve(true),
            } as any;

            const wsManager = new WebSocketManager(
                socketIoServer,
                mockedWeb3Provider,
                mockedDatabase,
                serverSecret,
            );

            client0 = await Client('http://localhost:4060', {
                auth: {
                    account: {
                        ensName: receiver.account.ensName,
                    },
                    token: generateAuthJWT(
                        receiver.account.ensName,
                        serverSecret,
                    ),
                },
            });

            const [socket0IsConnected] = await Promise.all([
                new Promise((res, rej) => {
                    client0.on(UNAUTHORIZED, (err: any) => {
                        rej();
                    });
                    client0.on(AUTHORIZED, (err: any) => {
                        res(true);
                    });
                }),
            ]);

            expect(socket0IsConnected).toBe(true);
            const isConnected = await wsManager.isConnected(receiver.address);
            expect(isConnected).toBe(true);
        });
        it('returns true if name has at least one account', async () => {
            const mockedWeb3Provider = {
                resolveName: (_: string) => Promise.resolve(receiver.address),
            } as any;

            const mockedDatabase = {
                getAccount: () =>
                    Promise.resolve({
                        account: receiver.address,
                        token: 'old token that is not used anymore',
                        createdAt: new Date().getTime(),
                    }),
                hasAccount: (_: string) => Promise.resolve(true),
            } as any;

            const wsManager = new WebSocketManager(
                socketIoServer,
                mockedWeb3Provider,
                mockedDatabase,
                serverSecret,
            );

            client0 = await Client('http://localhost:4060', {
                auth: {
                    account: {
                        ensName: receiver.account.ensName,
                    },
                    token: generateAuthJWT(
                        receiver.account.ensName,
                        serverSecret,
                    ),
                },
            });
            client1 = await Client('http://localhost:4060', {
                auth: {
                    account: {
                        ensName: receiver.account.ensName,
                    },
                    token: generateAuthJWT(
                        receiver.account.ensName,
                        serverSecret,
                    ),
                },
            });

            const [socket0IsConnected, socket1IsConnected] = await Promise.all([
                new Promise((res, rej) => {
                    client0.on(UNAUTHORIZED, (err: any) => {
                        rej();
                    });
                    client0.on(AUTHORIZED, (err: any) => {
                        res(true);
                    });
                }),
                new Promise((res, rej) => {
                    client1.on(UNAUTHORIZED, (err: any) => {
                        rej();
                    });
                    client1.on(AUTHORIZED, (err: any) => {
                        res(true);
                    });
                }),
            ]);

            expect(socket0IsConnected).toBe(true);
            expect(socket1IsConnected).toBe(true);
            let isConnected = await wsManager.isConnected(receiver.address);
            expect(isConnected).toBe(true);

            client0.close();
            await wait(500);
            isConnected = await wsManager.isConnected(receiver.address);
            expect(isConnected).toBe(true);
        });
        it('returns false if name is unknown', async () => {
            const mockedWeb3Provider = {
                resolveName: (_: string) => Promise.resolve(receiver.address),
            } as any;

            const mockedDatabase = {
                getAccount: () =>
                    Promise.resolve({
                        account: receiver.address,
                        token: 'old token that is not used anymore',
                        createdAt: new Date().getTime(),
                    }),
                hasAccount: (_: string) => Promise.resolve(true),
            } as any;

            const wsManager = new WebSocketManager(
                socketIoServer,
                mockedWeb3Provider,
                mockedDatabase,
                serverSecret,
            );

            client0 = await Client('http://localhost:4060', {
                auth: {
                    account: {
                        ensName: receiver.account.ensName,
                    },
                    token: generateAuthJWT(
                        receiver.account.ensName,
                        serverSecret,
                    ),
                },
            });

            const [socket0IsConnected] = await Promise.all([
                new Promise((res, rej) => {
                    client0.on(UNAUTHORIZED, (err: any) => {
                        rej();
                    });
                    client0.on(AUTHORIZED, (err: any) => {
                        res(true);
                    });
                }),
            ]);

            expect(socket0IsConnected).toBe(true);
            const isConnected = await wsManager.isConnected(rando.address);
            expect(isConnected).toBe(false);
        });
        it('keeps track of different independent accounts', async () => {
            const mockedWeb3Provider = {
                resolveName: (_: string) => {
                    if (_ === receiver.account.ensName) {
                        return Promise.resolve(receiver.address);
                    }
                    if (_ === sender.account.ensName) {
                        return Promise.resolve(sender.address);
                    }
                    if (_ === rando.account.ensName) {
                        return Promise.resolve(rando.address);
                    }
                },
            } as any;

            const mockedDatabase = {
                getAccount: (name: string) => {
                    if (name === receiver.account.ensName) {
                        return Promise.resolve({
                            account: receiver.address,
                        });
                    }
                    if (name === sender.account.ensName) {
                        return Promise.resolve({
                            account: sender.address,
                        });
                    }
                    if (name === rando.account.ensName) {
                        return Promise.resolve({
                            account: rando.address,
                        });
                    }
                },
                hasAccount: (_: string) => Promise.resolve(true),
            } as any;

            const wsManager = new WebSocketManager(
                socketIoServer,
                mockedWeb3Provider,
                mockedDatabase,
                serverSecret,
            );

            client0 = await Client('http://localhost:4060', {
                auth: {
                    account: {
                        ensName: receiver.account.ensName,
                    },
                    token: generateAuthJWT(
                        receiver.account.ensName,
                        serverSecret,
                    ),
                },
            });

            client1 = await Client('http://localhost:4060', {
                auth: {
                    account: {
                        ensName: sender.account.ensName,
                    },
                    token: generateAuthJWT(
                        sender.account.ensName,
                        serverSecret,
                    ),
                },
            });

            client2 = await Client('http://localhost:4060', {
                auth: {
                    account: {
                        ensName: rando.account.ensName,
                    },
                    token: generateAuthJWT(rando.account.ensName, serverSecret),
                },
            });

            const [socket0IsConnected, socket1IsConnected, socket2IsConnected] =
                await Promise.all([
                    new Promise((res, rej) => {
                        client0.on(UNAUTHORIZED, (err: any) => {
                            rej();
                        });
                        client0.on(AUTHORIZED, (err: any) => {
                            res(true);
                        });
                    }),
                    new Promise((res, rej) => {
                        client1.on(UNAUTHORIZED, (err: any) => {
                            rej();
                        });
                        client1.on(AUTHORIZED, (err: any) => {
                            res(true);
                        });
                    }),
                    new Promise((res, rej) => {
                        client2.on(UNAUTHORIZED, (err: any) => {
                            rej();
                        });
                        client2.on(AUTHORIZED, (err: any) => {
                            res(true);
                        });
                    }),
                ]);

            expect(socket0IsConnected).toBe(true);
            expect(socket1IsConnected).toBe(true);
            expect(socket2IsConnected).toBe(true);

            expect(await wsManager.isConnected(receiver.address)).toBe(true);
            expect(await wsManager.isConnected(sender.address)).toBe(true);
            expect(await wsManager.isConnected(rando.address)).toBe(true);

            client1.close();
            await wait(500);
            expect(await wsManager.isConnected(receiver.address)).toBe(true);
            expect(await wsManager.isConnected(sender.address)).toBe(false);
            expect(await wsManager.isConnected(rando.address)).toBe(true);
        });
        it('returns false after the user has closed all its connections', async () => {
            const mockedWeb3Provider = {
                resolveName: (_: string) => Promise.resolve(receiver.address),
            } as any;

            const mockedDatabase = {
                getAccount: () =>
                    Promise.resolve({
                        account: receiver.address,
                        token: 'old token that is not used anymore',
                        createdAt: new Date().getTime(),
                    }),
                hasAccount: (_: string) => Promise.resolve(true),
            } as any;

            const wsManager = new WebSocketManager(
                socketIoServer,
                mockedWeb3Provider,
                mockedDatabase,
                serverSecret,
            );

            client0 = await Client('http://localhost:4060', {
                auth: {
                    account: {
                        ensName: receiver.account.ensName,
                    },
                    token: generateAuthJWT(
                        receiver.account.ensName,
                        serverSecret,
                    ),
                },
            });

            const [socket0IsConnected] = await Promise.all([
                new Promise((res, rej) => {
                    client0.on(UNAUTHORIZED, (err: any) => {
                        rej();
                    });
                    client0.on(AUTHORIZED, (err: any) => {
                        res(true);
                    });
                }),
            ]);

            expect(socket0IsConnected).toBe(true);
            let isConnected = await wsManager.isConnected(receiver.address);
            expect(isConnected).toBe(true);

            client0.close();
            await wait(500);
            isConnected = await wsManager.isConnected(receiver.address);
            expect(isConnected).toBe(false);
        });
    });
});

export async function mockHttpServer(port: number): Promise<HttpServerType> {
    const httpServer = createServer();

    await new Promise<boolean>((res, rej) => {
        httpServer.listen(port, () => {
            res(true);
        });
    });

    return httpServer;
}

export const wait = (time: number) => {
    return new Promise<void>((res, rej) => {
        setTimeout(() => {
            res();
        }, time);
    });
};
