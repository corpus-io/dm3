import { EncryptionEnvelop, Postmark } from '@dm3-org/dm3-lib-messaging';
import {
    IWebSocketManager,
    NotificationChannel,
    NotificationChannelType,
    sha256,
    stringify,
} from '@dm3-org/dm3-lib-shared';
import { BigNumber, ethers } from 'ethers';
import { MessageProcessor } from './MessageProcessor';

import { checkSignature, decryptAsymmetric } from '@dm3-org/dm3-lib-crypto';
import {
    DeliveryServiceProperties,
    Account,
    spamFilter,
} from '@dm3-org/dm3-lib-delivery';
import { UserProfile, normalizeEnsName } from '@dm3-org/dm3-lib-profile';
import {
    MockDeliveryServiceProfile,
    MockMessageFactory,
    MockedUserProfile,
    getMockDeliveryServiceProfile,
    mockUserProfile,
} from '@dm3-org/dm3-lib-test-helper';
import { IDatabase } from '../persistence/getDatabase';
import { getAddress } from 'ethers/lib/utils';

jest.mock('nodemailer');

describe('MessageProcessor', () => {
    let sender: MockedUserProfile;
    let receiver: MockedUserProfile;
    let receiverOnGno: MockedUserProfile;
    let rando: MockedUserProfile;

    let ds: MockDeliveryServiceProfile;

    beforeEach(async () => {
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
    const getAccount = async (
        ensName: string,
        socketId?: string,
    ): Promise<
        (Account & { spamFilterRules: spamFilter.SpamFilterRules }) | null
    > => {
        const emptyProfile: UserProfile = {
            publicSigningKey: '',
            publicEncryptionKey: '',
            deliveryServices: [''],
        };
        const isSender = getAddress(ensName) === sender.address;
        const isReceiver = getAddress(ensName) === receiver.address;

        const account = (
            account: string,
            token: string,
            profile: UserProfile,
        ): Account => ({
            account,
            signedUserProfile: {
                profile,
                signature: '',
            },
            token,
            createdAt: new Date().getTime(),
            profileExtension: {
                encryptionAlgorithm: [],
                notSupportedMessageTypes: [],
            },
            socketId,
        });

        if (isSender) {
            return {
                ...account(sender.address, '123', emptyProfile),
                spamFilterRules: {},
            };
        }

        if (isReceiver) {
            return {
                ...account(getAddress(receiver.address), 'abc', {
                    ...emptyProfile,
                    publicEncryptionKey:
                        receiver.profileKeys.encryptionKeyPair.publicKey,
                }),
                spamFilterRules: {},
            };
        }

        return null;
    };

    it('accepts an incoming message', async () => {
        const db = {
            createMessage: async () => {},
            getIdEnsName: () => '',
            getAccount,
            getUsersNotificationChannels: () => Promise.resolve([]),
        } as any as IDatabase;

        const web3Provider = {
            resolveName: async (name: string) => {
                if (name === 'alice.eth' || name === 'alice.gno') {
                    return receiver.address;
                }
            },
        } as any;

        const mockWsManager: IWebSocketManager = {
            isConnected: function (ensName: string): Promise<boolean> {
                return Promise.resolve(false);
            },
        };

        const deliveryServiceProperties: DeliveryServiceProperties = {
            sizeLimit: 2 ** 14,
            messageTTL: 1000,
            notificationChannel: [],
        };

        const messageProcessor = new MessageProcessor(
            db,
            web3Provider,
            mockWsManager,
            deliveryServiceProperties,
            ds.keys,
            () => {},
        );

        const incomingEnvelop: EncryptionEnvelop = await MockMessageFactory(
            sender,
            receiver,
            ds,
        ).createEncryptedEnvelop('hello dm3');

        await expect(() =>
            messageProcessor.processEnvelop(incomingEnvelop),
        ).not.toThrow();
    });

    it('rejects an incoming message if it is to large', async () => {
        const db = {
            createMessage: async () => {},
            getIdEnsName: () => '',
            getAccount,
            getUsersNotificationChannels: () => Promise.resolve([]),
        } as any as IDatabase;

        const web3Provider = {
            resolveName: async (name: string) => {
                if (name === 'alice.eth' || name === 'alice.gno') {
                    return receiver.address;
                }
            },
        } as any;

        const mockWsManager: IWebSocketManager = {
            isConnected: function (ensName: string): Promise<boolean> {
                return Promise.resolve(false);
            },
        };

        const deliveryServiceProperties: DeliveryServiceProperties = {
            sizeLimit: 1,
            messageTTL: 1000,
            notificationChannel: [],
        };

        const messageProcessor = new MessageProcessor(
            db,
            web3Provider,
            mockWsManager,
            deliveryServiceProperties,
            ds.keys,
            () => {},
        );

        const incomingEnvelop: EncryptionEnvelop = await MockMessageFactory(
            sender,
            receiver,
            ds,
        ).createEncryptedEnvelop('hello dm3');

        await expect(() =>
            messageProcessor.processEnvelop(incomingEnvelop),
        ).rejects.toEqual(Error('Message is too large'));
    });
    it('rejects an incoming message if the receiver is unknown ', async () => {
        const db = {
            createMessage: async () => {},
            getIdEnsName: () => '',
            getAccount,
            getUsersNotificationChannels: () => Promise.resolve([]),
        } as any as IDatabase;

        const web3Provider = {
            resolveName: async (name: string) => {
                if (name === 'rando.eth') {
                    return rando.address;
                }
            },
        } as any;

        const mockWsManager: IWebSocketManager = {
            isConnected: function (ensName: string): Promise<boolean> {
                return Promise.resolve(false);
            },
        };

        const deliveryServiceProperties: DeliveryServiceProperties = {
            sizeLimit: 2 ** 14,
            messageTTL: 1000,
            notificationChannel: [],
        };

        const messageProcessor = new MessageProcessor(
            db,
            web3Provider,
            mockWsManager,
            deliveryServiceProperties,
            ds.keys,
            () => {},
        );

        const incomingEnvelop: EncryptionEnvelop = await MockMessageFactory(
            sender,
            rando,
            ds,
        ).createEncryptedEnvelop('hello rando');

        await expect(() =>
            messageProcessor.processEnvelop(incomingEnvelop),
        ).rejects.toEqual(Error('unknown account'));
    });
    // //TODO remove skip once spam-filter is implemented
    // //TODO remove skip once spam-filter is implemented
    it.skip('rejects message if the senders nonce is below the threshold', async () => {
        const _getAccount = async (address: string) =>
            ({
                ...(await getAccount(address)),
                spamFilterRules: { minNonce: 2 },
            } as Account & { spamFilterRules: spamFilter.SpamFilterRules });

        const db = {
            createMessage: async () => {},
            getIdEnsName: () => '',
            getAccount: _getAccount,
            getUsersNotificationChannels: () => Promise.resolve([]),
        } as any as IDatabase;

        const web3Provider = {
            getTransactionCount: async (_: string) => Promise.resolve(0),
            resolveName: async (name: string) => {
                if (name === 'alice.eth' || name === 'alice.gno') {
                    return receiver.address;
                }
            },
        } as any;

        const deliveryServiceProperties: DeliveryServiceProperties = {
            sizeLimit: 2 ** 14,
            messageTTL: 1000,
            notificationChannel: [],
        };

        const mockWsManager: IWebSocketManager = {
            isConnected: function (ensName: string): Promise<boolean> {
                return Promise.resolve(false);
            },
        };

        const messageProcessor = new MessageProcessor(
            db,
            web3Provider,
            mockWsManager,
            deliveryServiceProperties,
            ds.keys,
            () => {},
        );

        const incomingEnvelop: EncryptionEnvelop = await MockMessageFactory(
            sender,
            receiver,
            ds,
        ).createEncryptedEnvelop('hello dm3');

        try {
            await messageProcessor.processEnvelop(incomingEnvelop);
            fail();
        } catch (err: any) {
            expect(err.message).toBe('Message does not match spam criteria');
        }
    });
    it.skip('rejects message if the senders eth balance is below the threshold', async () => {
        const _getAccount = async (address: string) =>
            ({
                ...(await getAccount(address)),
                spamFilterRules: { minBalance: '0xa' },
            } as Account & { spamFilterRules: spamFilter.SpamFilterRules });

        const db = {
            createMessage: async () => {},
            getIdEnsName: () => '',
            getAccount: _getAccount,
            getUsersNotificationChannels: () => Promise.resolve([]),
        } as any as IDatabase;

        const web3Provider = {
            getBalance: async (_: string) => Promise.resolve(BigNumber.from(5)),
            resolveName: async (name: string) => {
                if (name === 'alice.eth' || name === 'alice.gno') {
                    return receiver.address;
                }
            },
        } as any;

        const deliveryServiceProperties: DeliveryServiceProperties = {
            sizeLimit: 2 ** 14,
            messageTTL: 1000,
            notificationChannel: [],
        };

        const mockWsManager: IWebSocketManager = {
            isConnected: function (ensName: string): Promise<boolean> {
                return Promise.resolve(false);
            },
        };

        const messageProcessor = new MessageProcessor(
            db,
            web3Provider,
            mockWsManager,
            deliveryServiceProperties,
            ds.keys,
            () => {},
        );

        const incomingEnvelop: EncryptionEnvelop = await MockMessageFactory(
            sender,
            receiver,
            ds,
        ).createEncryptedEnvelop('hello dm3');

        try {
            messageProcessor.processEnvelop(incomingEnvelop), fail();
        } catch (err: any) {
            expect(err.message).toBe('Message does not match spam criteria');
        }
    });
    // //TODO remove skip once spam-filter is implemented
    it.skip('rejects message if the senders token balance is below the threshold', async () => {
        const _getAccount = async (address: string) =>
            ({
                ...(await getAccount(address)),
                spamFilterRules: {
                    minTokenBalance: {
                        address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                        amount: '0xa',
                    },
                },
            } as Account & { spamFilterRules: spamFilter.SpamFilterRules });

        const db = {
            createMessage: async () => {},
            getIdEnsName: () => '',
            getAccount: _getAccount,
            getUsersNotificationChannels: () => Promise.resolve([]),
        } as any as IDatabase;

        const web3Provider = {
            _isProvider: true,
            call: () => Promise.resolve(BigNumber.from(0).toHexString()),
            resolveName: async (name: string) => {
                if (name === 'alice.eth' || name === 'alice.gno') {
                    return receiver.address;
                }
            },
        } as unknown as ethers.providers.JsonRpcProvider;

        const mockWsManager: IWebSocketManager = {
            isConnected: function (ensName: string): Promise<boolean> {
                return Promise.resolve(false);
            },
        };

        const deliveryServiceProperties: DeliveryServiceProperties = {
            sizeLimit: 2 ** 14,
            messageTTL: 1000,
            notificationChannel: [],
        };

        const messageProcessor = new MessageProcessor(
            db,
            web3Provider,
            mockWsManager,
            deliveryServiceProperties,
            ds.keys,
            () => {},
        );

        const incomingEnvelop: EncryptionEnvelop = await MockMessageFactory(
            sender,
            receiver,
            ds,
        ).createEncryptedEnvelop('hello dm3');

        try {
            messageProcessor.processEnvelop(incomingEnvelop);
            fail();
        } catch (err: any) {
            expect(err.message).toBe('Message does not match spam criteria');
        }
    });

    it('send mail after incoming message', async () => {
        const sendMessageViaSocketMock = jest.fn();
        const sendMailMock = jest.fn();

        //mock nodemailer
        const nodemailer = require('nodemailer'); //doesn't work with import. idk why
        nodemailer.createTransport.mockReturnValue({
            sendMail: sendMailMock,
            close: () => {},
        });

        const getNotificationChannels = (user: string) => {
            return Promise.resolve([
                {
                    type: NotificationChannelType.EMAIL,
                    config: {
                        recipientEmailId: 'joe12345@gmail.com',
                        isVerified: true,
                        isEnabled: true,
                    },
                },
            ]);
        };

        const db = {
            createMessage: async () => {},
            getIdEnsName: () => '',
            getAccount,
            getUsersNotificationChannels: getNotificationChannels,
        } as any as IDatabase;

        const dsNotificationChannels: NotificationChannel[] = [
            {
                type: NotificationChannelType.EMAIL,
                config: {
                    smtpHost: 'smtp.gmail.com',
                    smtpPort: 587,
                    smtpEmail: 'abc@gmail.com',
                    smtpUsername: 'abc@gmail.com',
                    smtpPassword: 'abcd1234',
                },
            },
        ];

        const web3Provider = {
            getBalance: async (_: string) => Promise.resolve(BigNumber.from(5)),
            resolveName: async (name: string) => {
                if (name === 'alice.eth' || name === 'alice.gno') {
                    return receiver.address;
                }
            },
        } as any;

        const mockWsManager: IWebSocketManager = {
            isConnected: function (ensName: string): Promise<boolean> {
                return Promise.resolve(false);
            },
        };

        const deliveryServiceProperties: DeliveryServiceProperties = {
            sizeLimit: 2 ** 14,
            messageTTL: 1000,
            notificationChannel: dsNotificationChannels,
        };

        const messageProcessor = new MessageProcessor(
            db,
            web3Provider,
            mockWsManager,
            deliveryServiceProperties,
            ds.keys,
            () => {},
        );
        const incomingEnvelop: EncryptionEnvelop = await MockMessageFactory(
            sender,
            receiver,
            ds,
        ).createEncryptedEnvelop('hello dm3');

        await messageProcessor.processEnvelop(incomingEnvelop);

        expect(sendMailMock).toHaveBeenCalled();

        //Check if the message was submitted to the socket
        expect(sendMessageViaSocketMock).not.toBeCalled();
    });
    it('stores proper incoming message', async () => {
        const sendMock = jest.fn();
        const createMessageMock = jest.fn();

        const now = Date.now();

        const mockWsManager: IWebSocketManager = {
            isConnected: function (ensName: string): Promise<boolean> {
                return Promise.resolve(false);
            },
        };

        const db = {
            createMessage: createMessageMock,
            getIdEnsName: () => '',
            getAccount,
            getUsersNotificationChannels: () => Promise.resolve([]),
        } as any as IDatabase;

        const web3Provider = {
            getBalance: async (_: string) => Promise.resolve(BigNumber.from(5)),
            resolveName: async (name: string) => {
                if (name === 'alice.eth' || name === 'alice.gno') {
                    return receiver.address;
                }
            },
        } as any;

        const deliveryServiceProperties: DeliveryServiceProperties = {
            sizeLimit: 2 ** 14,
            messageTTL: 1000,
            notificationChannel: [],
        };

        const messageProcessor = new MessageProcessor(
            db,
            web3Provider,
            mockWsManager,
            deliveryServiceProperties,
            ds.keys,
            () => {},
        );

        const incomingEnvelop: EncryptionEnvelop = await MockMessageFactory(
            sender,
            receiver,
            ds,
        ).createEncryptedEnvelop('hello dm3');

        await messageProcessor.processEnvelop(incomingEnvelop);

        //createMessageCall
        const [receiverAddress, _, actualEnvelop] =
            createMessageMock.mock.calls[0];

        expect(createMessageMock).toBeCalled();
        expect(receiverAddress).toBe(receiver.address);
        expect(actualEnvelop['message']).toBe(incomingEnvelop.message);

        const actualPostmark = await decryptAsymmetric(
            receiver.profileKeys.encryptionKeyPair,
            JSON.parse(actualEnvelop['postmark']),
        );

        // check postmark
        const { incommingTimestamp, messageHash, signature } =
            JSON.parse(actualPostmark);
        expect(incommingTimestamp).toBeGreaterThanOrEqual(now);
        expect(incommingTimestamp).toBeLessThanOrEqual(Date.now());
        expect(messageHash).toBe(
            ethers.utils.hashMessage(stringify(incomingEnvelop.message)),
        );
        const postmarkWithoutSig: Omit<Postmark, 'signature'> = {
            messageHash,
            incommingTimestamp,
        };
        expect(
            await checkSignature(
                ds.keys.signingKeyPair.publicKey,
                sha256(stringify(postmarkWithoutSig)),
                signature,
            ),
        ).toBe(true);
        //Check if the message was submitted to the socket
        expect(sendMock).not.toBeCalled();
    });
    it('stores proper incoming message using address', async () => {
        const sendMock = jest.fn();
        const createMessageMock = jest.fn();

        const now = Date.now();

        const mockWsManager: IWebSocketManager = {
            isConnected: function (ensName: string): Promise<boolean> {
                return Promise.resolve(false);
            },
        };

        const db = {
            createMessage: createMessageMock,
            getIdEnsName: () => '',
            getAccount,
            getUsersNotificationChannels: () => Promise.resolve([]),
        } as any as IDatabase;

        const web3Provider = {
            getBalance: async (_: string) => Promise.resolve(BigNumber.from(5)),
            resolveName: async (name: string) => {
                if (name === 'alice.eth' || name === 'alice.gno') {
                    return receiver.address;
                }
            },
        } as any;

        const deliveryServiceProperties: DeliveryServiceProperties = {
            sizeLimit: 2 ** 14,
            messageTTL: 1000,
            notificationChannel: [],
        };

        const messageProcessor = new MessageProcessor(
            db,
            web3Provider,
            mockWsManager,
            deliveryServiceProperties,
            ds.keys,
            () => {},
        );

        const incomingEnvelop1: EncryptionEnvelop = await MockMessageFactory(
            sender,
            receiver,
            ds,
        ).createEncryptedEnvelop('hello dm3 from ens');
        const incomingEnvelop2: EncryptionEnvelop = await MockMessageFactory(
            sender,
            receiverOnGno,
            ds,
        ).createEncryptedEnvelop('hello dm3 from gno');

        await messageProcessor.processEnvelop(incomingEnvelop1);
        await messageProcessor.processEnvelop(incomingEnvelop2);

        //createMessageCall
        const [receiverAddress, _, actualEnvelop] =
            createMessageMock.mock.calls[0];

        expect(createMessageMock).toBeCalled();
        expect(createMessageMock).toBeCalledTimes(2);
        expect(receiverAddress).toBe(receiver.address);

        expect(actualEnvelop['message']).toBe(incomingEnvelop1.message);

        const actualPostmark = await decryptAsymmetric(
            receiver.profileKeys.encryptionKeyPair,
            JSON.parse(actualEnvelop['postmark']),
        );

        // check postmark
        const { incommingTimestamp, messageHash, signature } =
            JSON.parse(actualPostmark);
        expect(incommingTimestamp).toBeGreaterThanOrEqual(now);
        expect(incommingTimestamp).toBeLessThanOrEqual(Date.now());
        expect(messageHash).toBe(
            ethers.utils.hashMessage(stringify(incomingEnvelop1.message)),
        );
        const postmarkWithoutSig: Omit<Postmark, 'signature'> = {
            messageHash,
            incommingTimestamp,
        };
        expect(
            await checkSignature(
                ds.keys.signingKeyPair.publicKey,
                sha256(stringify(postmarkWithoutSig)),
                signature,
            ),
        ).toBe(true);
        //Check if the message was submitted to the socket
        expect(sendMock).not.toBeCalled();
    });

    it('stores proper incoming message and submit it if receiver is connected to a socket', async () => {
        const sendMock = jest.fn();
        const createMessageMock = jest.fn();

        const now = Date.now();

        const mockWsManager: IWebSocketManager = {
            isConnected: function (ensName: string): Promise<boolean> {
                return Promise.resolve(true);
            },
        };

        const db = {
            createMessage: createMessageMock,
            getIdEnsName: () => '',
            getAccount,
            getUsersNotificationChannels: () => Promise.resolve([]),
        } as any as IDatabase;

        const web3Provider = {
            getBalance: async (_: string) => Promise.resolve(BigNumber.from(5)),
            resolveName: async (name: string) => {
                if (name === 'alice.eth' || name === 'alice.gno') {
                    return receiver.address;
                }
            },
        } as any;

        const deliveryServiceProperties: DeliveryServiceProperties = {
            sizeLimit: 2 ** 14,
            messageTTL: 1000,
            notificationChannel: [],
        };

        const messageProcessor = new MessageProcessor(
            db,
            web3Provider,
            mockWsManager,
            deliveryServiceProperties,
            ds.keys,
            sendMock,
        );

        const incomingEnvelop: EncryptionEnvelop = await MockMessageFactory(
            sender,
            receiver,
            ds,
        ).createEncryptedEnvelop('hello dm3');

        await messageProcessor.processEnvelop(incomingEnvelop);

        //createMessageCall
        const [receiverAddress, _, actualEnvelop] =
            createMessageMock.mock.calls[0];

        expect(createMessageMock).toBeCalled();
        expect(receiverAddress).toBe(receiver.address);
        expect(actualEnvelop['message']).toBe(incomingEnvelop.message);

        const actualPostmark = await decryptAsymmetric(
            receiver.profileKeys.encryptionKeyPair,
            JSON.parse(actualEnvelop['postmark']),
        );

        // check postmark
        const { incommingTimestamp, messageHash, signature } =
            JSON.parse(actualPostmark);
        expect(incommingTimestamp).toBeGreaterThanOrEqual(now);
        expect(incommingTimestamp).toBeLessThanOrEqual(Date.now());
        expect(messageHash).toBe(
            ethers.utils.hashMessage(stringify(incomingEnvelop.message)),
        );
        const postmarkWithoutSig: Omit<Postmark, 'signature'> = {
            messageHash,
            incommingTimestamp,
        };
        expect(
            await checkSignature(
                ds.keys.signingKeyPair.publicKey,
                sha256(stringify(postmarkWithoutSig)),
                signature,
            ),
        ).toBe(true);
        expect(sendMock).toBeCalled();
    });
});
