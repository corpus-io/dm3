import { Account } from '@dm3-org/dm3-lib-delivery';
import { EncryptionEnvelop } from '@dm3-org/dm3-lib-messaging';
import { UserProfile } from '@dm3-org/dm3-lib-profile';
import { IWebSocketManager, ethersHelper } from '@dm3-org/dm3-lib-shared';
import {
    MockDeliveryServiceProfile,
    MockMessageFactory,
    MockedUserProfile,
    getMockDeliveryServiceProfile,
    mockUserProfile,
} from '@dm3-org/dm3-lib-test-helper';
import { ethers } from 'ethers';
import { Socket } from 'socket.io';
import { onConnection } from './messaging';

const serverSecret = 'secret';
const mockWsManager: IWebSocketManager = {
    isConnected: function (ensName: string): Promise<boolean> {
        return Promise.resolve(false);
    },
};

describe('Messaging', () => {
    let sender: MockedUserProfile;
    let receiver: MockedUserProfile;
    let ds: MockDeliveryServiceProfile;

    beforeEach(async () => {
        const receiverWallet = ethers.Wallet.createRandom();
        sender = await mockUserProfile(
            ethers.Wallet.createRandom(),
            'bob.eth',
            ['http://localhost:3000'],
        );
        receiver = await mockUserProfile(receiverWallet, 'alice.eth', [
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
            return account(receiver.address, 'abc', {
                ...emptyProfile,
                publicEncryptionKey:
                    receiver.profileKeys.encryptionKeyPair.publicKey,
            });
        }

        return null;
    };

    const web3Provider = {
        resolveName: async (name: string) => {
            if (name === 'alice.eth') {
                return receiver.address;
            }
        },
    } as any;

    const db = {
        getAccount,
        createMessage: () => {},
        getIdEnsName: async (ensName: string) => ensName,
        getUsersNotificationChannels: () => Promise.resolve([]),
    };
    const io = {
        sockets: {
            to: (_: any) => ({
                emit: (_: any, __any: any) => {},
            }),
        },
    };

    describe('submitMessage', () => {
        it('returns success if schema is valid', (done: any) => {
            //We expect the callback function to be called once with
            // the value 'success'
            expect.assertions(1);

            const callback = (e: any) => {
                // Even though the method fails jest doesn't recognize it because
                // of the catch block used in messaging.ts. So we have to throw
                // another error if the callback returns anything else then the expected
                // result.
                expect(e.response).toBe('success');
                done();
            };

            const getSocketMock = () => {
                return {
                    on: async (name: string, onSubmitMessage: any) => {
                        //We just want to test the submitMessage callback fn
                        if (name === 'submitMessage') {
                            const envelop: EncryptionEnvelop =
                                await MockMessageFactory(
                                    sender,
                                    receiver,
                                    ds,
                                ).createEncryptedEnvelop('hello dm3');
                            await onSubmitMessage(
                                { envelop, token: '123' },
                                callback,
                            );
                        }
                    },
                } as unknown as Socket;
            };

            onConnection(
                io as any,
                web3Provider as any,
                db as any,
                ds.keys,
                serverSecret,
                mockWsManager,
            )(getSocketMock());
        });

        it('returns success even without token if schema is valid', (done: any) => {
            //We expect the callback function to be called once with
            // the value 'success'
            expect.assertions(1);

            const callback = (e: any) => {
                // Even though the method fails jest doesn't recognize it because
                // of the catch block used in messaging.ts. So we have to throw
                // another error if the callback returns anything else then the expected
                // result.
                expect(e.response).toBe('success');
                done();
            };

            const getSocketMock = () => {
                return {
                    on: async (name: string, onSubmitMessage: any) => {
                        //We just want to test the submitMessage callback fn
                        if (name === 'submitMessage') {
                            const envelop: EncryptionEnvelop =
                                await MockMessageFactory(
                                    sender,
                                    receiver,
                                    ds,
                                ).createEncryptedEnvelop('hello dm3');
                            await onSubmitMessage({ envelop }, callback);
                        }
                    },
                } as unknown as Socket;
            };

            onConnection(
                io as any,
                web3Provider as any,
                db as any,
                ds.keys,
                serverSecret,
                mockWsManager,
            )(getSocketMock());
        });
        it.skip('returns error if message is spam', (done: any) => {
            //We expect the callback functions called once with the value 'success'
            expect.assertions(1);
            const callback = jest.fn((e: any) => {
                /*
                 * Even though the method fails jest dosen't recognize it because of the catch block
                 * used in messaging.ts. So we have to throw another error if the callback returns
                 * anything else then the expected result.
                 */
                expect(e.error).toBe('Message does not match spam criteria');
                done();
            });

            const account = async (addr: string) => {
                return {
                    ...(await getAccount(addr)),
                    spamFilterRules: { minNonce: 2 },
                } as Account;
            };
            const db = {
                getAccount: account,
                createMessage: () => {},
                getIdEnsName: async (ensName: string) => ensName,
                getUsersNotificationChannels: () => Promise.resolve([]),
            };

            const getSocketMock = () => {
                return {
                    on: async (name: string, onSubmitMessage: any) => {
                        //We just want to test the submitMessage callback fn
                        if (name === 'submitMessage') {
                            const envelop: EncryptionEnvelop =
                                await MockMessageFactory(
                                    sender,
                                    receiver,
                                    ds,
                                ).createEncryptedEnvelop('hello dm3');
                            await onSubmitMessage(
                                {
                                    envelop,
                                },
                                callback,
                            );
                        }
                    },
                } as unknown as Socket;
            };

            onConnection(
                io as any,
                web3Provider as any,
                db as any,
                ds.keys,
                serverSecret,
                mockWsManager,
            )(getSocketMock());
        });
        it('Throws error if schema is invalid', async () => {
            expect.assertions(1);
            const callback = jest.fn((e: any) => {
                /**
                 * Even though the method fails jest dosen't recognize it because of the
                 * catch block used in messaging.ts. So we have to throw another error if
                 * the callback returns anything else then the expected result.
                 */
                expect(e.error).toBe('invalid schema');
            });

            const envelop: EncryptionEnvelop = await MockMessageFactory(
                sender,
                receiver,
                ds,
            ).createEncryptedEnvelop('hello dm3');

            const localData = { envelop };
            const metadata = localData.envelop.metadata as any;
            // Change the data so it becomes invalid in order to provoke the 'invalid schema' error
            delete metadata.deliveryInformation;
            localData.envelop.metadata = metadata;

            const getSocketMock = jest.fn(() => {
                return {
                    on: async (name: string, onSubmitMessage: any) => {
                        //We just want to test the submitMessage callback fn
                        if (name === 'submitMessage') {
                            await onSubmitMessage(localData, await callback);
                        }
                    },
                } as unknown as Socket;
            });

            onConnection(
                io as any,
                web3Provider as any,
                db as any,
                ds.keys,
                serverSecret,
                mockWsManager,
            )(getSocketMock());
        });
    });
});
