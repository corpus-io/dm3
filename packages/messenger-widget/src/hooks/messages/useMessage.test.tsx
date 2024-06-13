import '@testing-library/jest-dom';
import { act, renderHook, waitFor } from '@testing-library/react';
import { AuthContext } from '../../context/AuthContext';
import { ConversationContext } from '../../context/ConversationContext';
import { DeliveryServiceContext } from '../../context/DeliveryServiceContext';
import { StorageContext } from '../../context/StorageContext';
import { TLDContext } from '../../context/TLDContext';
import { getMockedAuthContext } from '../../context/testHelper/getMockedAuthContext';
import { getMockedConversationContext } from '../../context/testHelper/getMockedConversationContext';
import { getMockedDeliveryServiceContext } from '../../context/testHelper/getMockedDeliveryServiceContext';
import { getMockedStorageContext } from '../../context/testHelper/getMockedStorageContext';
import { getMockedTldContext } from '../../context/testHelper/getMockedTldContext';
import { getDefaultContract } from '../../interfaces/utils';
import { useMessage } from './useMessage';
import {
    MockDeliveryServiceProfile,
    MockMessageFactory,
    MockedUserProfile,
    getMockDeliveryServiceProfile,
    mockUserProfile,
} from '@dm3-org/dm3-lib-test-helper';
import { ethers } from 'ethers';
import { useConversation } from '../conversation/useConversation';
import {
    MainnetProviderContext,
    MainnetProviderContextType,
} from '../../context/ProviderContext';
import { getMockedMainnetProviderContext } from '../../context/testHelper/getMockedMainnetProviderContext';
import {
    DEFAULT_DM3_CONFIGURATION,
    getMockedDm3Configuration,
} from '../../context/testHelper/getMockedDm3Configuration';
import { DM3Configuration } from '../../widget';
import { Conversation } from '@dm3-org/dm3-lib-storage';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';

describe('useMessage hook test cases', () => {
    const CONTACT_NAME = 'user.dm3.eth';

    it('Should configure useMessage hook', async () => {
        const { result } = renderHook(() => useMessage());
        expect(JSON.stringify(result.current.messages)).toBe(
            JSON.stringify({}),
        );
    });

    it('Should get messages for a contact ', async () => {
        const { result } = renderHook(() => useMessage());
        const messages = await act(async () =>
            result.current.getMessages(CONTACT_NAME),
        );
        expect(messages.length).toBe(0);
    });

    it('Should check contact is loading or not ', async () => {
        const { result } = renderHook(() => useMessage());
        const loading = await act(async () =>
            result.current.contactIsLoading(CONTACT_NAME),
        );
        expect(loading).toBe(false);
    });

    it('Should check contact is loading or not ', async () => {
        const { result } = renderHook(() => useMessage());
        const unreadMsgCount = await act(async () =>
            result.current.getUnreadMessageCount(CONTACT_NAME),
        );
        expect(unreadMsgCount).toBe(0);
    });

    describe('add Message', () => {
        let sender: MockedUserProfile;
        let receiver: MockedUserProfile;
        let ds1: MockDeliveryServiceProfile;
        let ds2: MockDeliveryServiceProfile;

        let axiosMock: MockAdapter;

        beforeEach(async () => {
            sender = await mockUserProfile(
                ethers.Wallet.createRandom(),
                'alice.eth',
                ['ds1.eth'],
            );
            receiver = await mockUserProfile(
                ethers.Wallet.createRandom(),
                'bob.eth',
                ['ds1.eth', 'ds2.eth'],
            );
            ds1 = await getMockDeliveryServiceProfile(
                ethers.Wallet.createRandom(),
                'http://ds1.api',
            );
            ds2 = await getMockDeliveryServiceProfile(
                ethers.Wallet.createRandom(),
                'http://ds2.api',
            );
        });
        const CONTACT_NAME = 'user.dm3.eth';

        const configurationContext = getMockedDm3Configuration({
            dm3Configuration: {
                ...DEFAULT_DM3_CONFIGURATION,
            },
        });
        const config: DM3Configuration = configurationContext.dm3Configuration!;

        it('should not add empty message', async () => {
            const storageContext = getMockedStorageContext({
                editMessageBatchAsync: jest.fn(),
                storeMessageBatch: jest.fn(),
                storeMessage: jest.fn(),
            });
            const conversationContext = getMockedConversationContext({
                selectedContact: getDefaultContract('max.eth'),
            });
            const deliveryServiceContext = getMockedDeliveryServiceContext({
                //Add websocket mock
                onNewMessage: (cb: Function) => {
                    console.log('on new message');
                },
                removeOnNewMessageListener: jest.fn(),
            });
            const authContext = getMockedAuthContext({});
            const tldContext = getMockedTldContext({});

            const wrapper = ({ children }: { children: any }) => (
                <>
                    <AuthContext.Provider value={authContext}>
                        <TLDContext.Provider value={tldContext}>
                            <StorageContext.Provider value={storageContext}>
                                <ConversationContext.Provider
                                    value={conversationContext}
                                >
                                    <DeliveryServiceContext.Provider
                                        value={deliveryServiceContext}
                                    >
                                        {children}
                                    </DeliveryServiceContext.Provider>
                                </ConversationContext.Provider>
                            </StorageContext.Provider>
                        </TLDContext.Provider>
                    </AuthContext.Provider>
                </>
            );

            const { result } = renderHook(() => useMessage(), {
                wrapper,
            });
            await waitFor(() =>
                expect(result.current.contactIsLoading('max.eth')).toBe(false),
            );

            const messageFactory = MockMessageFactory(sender, receiver, ds1);
            const message = await messageFactory.createMessage('');
            const addMessageResult = await waitFor(() =>
                result.current.addMessage('max.eth', message),
            );

            expect(addMessageResult).toEqual({
                isSuccess: false,
                error: 'Message is empty',
            });
        });
        it('should trim message', async () => {
            const storageContext = getMockedStorageContext({
                editMessageBatchAsync: jest.fn(),
                storeMessageBatch: jest.fn(),
                storeMessage: jest.fn(),
            });
            const conversationContext = getMockedConversationContext({
                selectedContact: getDefaultContract('max.eth'),
            });
            const deliveryServiceContext = getMockedDeliveryServiceContext({
                //Add websocket mock
                onNewMessage: (cb: Function) => {
                    console.log('on new message');
                },
                removeOnNewMessageListener: jest.fn(),
            });
            const authContext = getMockedAuthContext({});
            const tldContext = getMockedTldContext({});

            const wrapper = ({ children }: { children: any }) => (
                <>
                    <AuthContext.Provider value={authContext}>
                        <TLDContext.Provider value={tldContext}>
                            <StorageContext.Provider value={storageContext}>
                                <ConversationContext.Provider
                                    value={conversationContext}
                                >
                                    <DeliveryServiceContext.Provider
                                        value={deliveryServiceContext}
                                    >
                                        {children}
                                    </DeliveryServiceContext.Provider>
                                </ConversationContext.Provider>
                            </StorageContext.Provider>
                        </TLDContext.Provider>
                    </AuthContext.Provider>
                </>
            );

            const { result } = renderHook(() => useMessage(), {
                wrapper,
            });
            await waitFor(() =>
                expect(result.current.contactIsLoading('max.eth')).toBe(false),
            );

            const messageFactory = MockMessageFactory(sender, receiver, ds1);
            const message = await messageFactory.createMessage('         ');
            const addMessageResult = await waitFor(() =>
                result.current.addMessage('max.eth', message),
            );

            expect(addMessageResult).toEqual({
                isSuccess: false,
                error: 'Message is empty',
            });
        });
        it('should add message', async () => {
            const storageContext = getMockedStorageContext({
                editMessageBatchAsync: jest.fn(),
                storeMessageBatch: jest.fn(),
                storeMessage: jest.fn(),
            });
            const conversationContext = getMockedConversationContext({
                selectedContact: getDefaultContract('max.eth'),
            });
            const deliveryServiceContext = getMockedDeliveryServiceContext({
                //Add websocket mock
                onNewMessage: (cb: Function) => {
                    console.log('on new message');
                },
                removeOnNewMessageListener: jest.fn(),
            });
            const authContext = getMockedAuthContext({});
            const tldContext = getMockedTldContext({});

            const wrapper = ({ children }: { children: any }) => (
                <>
                    <AuthContext.Provider value={authContext}>
                        <TLDContext.Provider value={tldContext}>
                            <StorageContext.Provider value={storageContext}>
                                <ConversationContext.Provider
                                    value={conversationContext}
                                >
                                    <DeliveryServiceContext.Provider
                                        value={deliveryServiceContext}
                                    >
                                        {children}
                                    </DeliveryServiceContext.Provider>
                                </ConversationContext.Provider>
                            </StorageContext.Provider>
                        </TLDContext.Provider>
                    </AuthContext.Provider>
                </>
            );

            const { result } = renderHook(() => useMessage(), {
                wrapper,
            });
            await waitFor(() =>
                expect(result.current.contactIsLoading('max.eth')).toBe(false),
            );

            const messageFactory = MockMessageFactory(sender, receiver, ds1);
            const message = await messageFactory.createMessage('hello dm3');
            const addMessageResult = await waitFor(() =>
                result.current.addMessage('alice.eth', message),
            );

            expect(addMessageResult).toEqual({
                isSuccess: true,
                error: undefined,
            });
            expect(result.current.messages['alice.eth'].length).toBe(1);
        });
        it('should send message to ds', async () => {
            axiosMock = new MockAdapter(axios);

            axiosMock.onPost('http://ds1.api/rpc').reply(200, {});

            axiosMock.onPost('http://ds2.api/rpc').reply(200, {});

            const storageContext = getMockedStorageContext({
                editMessageBatchAsync: jest.fn(),
                storeMessageBatch: jest.fn(),
                storeMessage: jest.fn(),
                getNumberOfMessages: jest.fn().mockResolvedValue(0),
                getMessages: jest.fn().mockResolvedValue([]),
            });

            const conversationContext = getMockedConversationContext({
                selectedContact: getDefaultContract('max.eth'),
                contacts: [
                    {
                        name: '',
                        message: '',
                        image: 'human.svg',
                        messageCount: 1,
                        unreadMsgCount: 21,
                        contactDetails: {
                            account: {
                                ensName: receiver.account.ensName,
                                profileSignature:
                                    receiver.signedUserProfile.signature,
                                profile: receiver.signedUserProfile.profile,
                            },
                            deliveryServiceProfiles: [
                                ds1.deliveryServiceProfile,
                                ds2.deliveryServiceProfile,
                            ],
                        },
                        isHidden: false,
                        messageSizeLimit: 10000000,
                    },
                ],
            });
            const deliveryServiceContext = getMockedDeliveryServiceContext({
                //Add websocket mock
                onNewMessage: (cb: Function) => {
                    console.log('on new message');
                },
                fetchNewMessages: jest.fn().mockResolvedValue([]),
                removeOnNewMessageListener: jest.fn(),
                syncAcknowledgment: jest.fn(),
            });

            const authContext = getMockedAuthContext({
                profileKeys: receiver.profileKeys,
                account: {
                    ensName: sender.account.ensName,
                    profile: sender.signedUserProfile.profile,
                },
            });
            const tldContext = getMockedTldContext({});

            const wrapper = ({ children }: { children: any }) => (
                <>
                    <AuthContext.Provider value={authContext}>
                        <TLDContext.Provider value={tldContext}>
                            <StorageContext.Provider value={storageContext}>
                                <ConversationContext.Provider
                                    value={conversationContext}
                                >
                                    <DeliveryServiceContext.Provider
                                        value={deliveryServiceContext}
                                    >
                                        {children}
                                    </DeliveryServiceContext.Provider>
                                </ConversationContext.Provider>
                            </StorageContext.Provider>
                        </TLDContext.Provider>
                    </AuthContext.Provider>
                </>
            );

            const { result } = renderHook(() => useMessage(), {
                wrapper,
            });
            await waitFor(() =>
                expect(result.current.contactIsLoading('max.eth')).toBe(false),
            );

            const messageFactory = MockMessageFactory(sender, receiver, ds1);
            const message = await messageFactory.createMessage('hello dm3');
            const addMessageResult = await waitFor(() =>
                result.current.addMessage('bob.eth', message),
            );

            expect(addMessageResult).toEqual({
                isSuccess: true,
                error: undefined,
            });
            expect(result.current.messages['bob.eth'].length).toBe(1);

            expect(axiosMock.history.post.length).toBe(2);
            expect(axiosMock.history.post[0].baseURL).toBe('http://ds1.api');
            expect(axiosMock.history.post[1].baseURL).toBe('http://ds2.api');
        });
    });

    describe('initialize message', () => {
        let sender: MockedUserProfile;
        let receiver: MockedUserProfile;
        let ds: any;

        beforeEach(async () => {
            sender = await mockUserProfile(
                ethers.Wallet.createRandom(),
                'alice.eth',
                ['https://example.com'],
            );
            receiver = await mockUserProfile(
                ethers.Wallet.createRandom(),
                'bob.eth',
                ['https://example.com'],
            );
            ds = await getMockDeliveryServiceProfile(
                ethers.Wallet.createRandom(),
                'https://example.com',
            );
        });

        it('should initialize message from storage ', async () => {
            const messageFactory = MockMessageFactory(sender, receiver, ds);
            const message1 = await messageFactory.createStorageEnvelopContainer(
                'hello dm3',
            );
            const message2 = await messageFactory.createStorageEnvelopContainer(
                'hello world',
            );
            const message3 = await messageFactory.createStorageEnvelopContainer(
                'hello bob',
            );

            const storageContext = getMockedStorageContext({
                editMessageBatchAsync: jest.fn(),
                storeMessageBatch: jest.fn(),
                storeMessage: jest.fn(),
                getMessages: jest
                    .fn()
                    .mockResolvedValue([message1, message2, message3]),
                getNumberOfMessages: jest.fn().mockResolvedValue(3),
            });
            const conversationContext = getMockedConversationContext({
                selectedContact: getDefaultContract('max.eth'),
                contacts: [getDefaultContract('alice.eth')],
            });
            const deliveryServiceContext = getMockedDeliveryServiceContext({
                onNewMessage: (cb: Function) => {
                    console.log('on new message');
                },
                fetchNewMessages: jest.fn().mockResolvedValue([]),
                syncAcknowledgment: jest.fn(),
                removeOnNewMessageListener: jest.fn(),
            });
            const authContext = getMockedAuthContext({
                profileKeys: receiver.profileKeys,
                account: {
                    ensName: 'bob.eth',
                    profile: {
                        deliveryServices: ['ds.eth'],
                        publicEncryptionKey: '',
                        publicSigningKey: '',
                    },
                },
            });
            const tldContext = getMockedTldContext({});

            const wrapper = ({ children }: { children: any }) => (
                <>
                    <AuthContext.Provider value={authContext}>
                        <TLDContext.Provider value={tldContext}>
                            <StorageContext.Provider value={storageContext}>
                                <ConversationContext.Provider
                                    value={conversationContext}
                                >
                                    <DeliveryServiceContext.Provider
                                        value={deliveryServiceContext}
                                    >
                                        {children}
                                    </DeliveryServiceContext.Provider>
                                </ConversationContext.Provider>
                            </StorageContext.Provider>
                        </TLDContext.Provider>
                    </AuthContext.Provider>
                </>
            );

            const { result } = renderHook(() => useMessage(), {
                wrapper,
            });
            //Wait until bobs messages have been initialized
            await waitFor(
                () =>
                    result.current.contactIsLoading('alice.eth') === false &&
                    result.current.messages['alice.eth'].length > 0,
            );

            expect(result.current.contactIsLoading('alice.eth')).toBe(false);
            expect(result.current.messages['alice.eth'].length).toBe(3);
        });
        it('should initialize message from DS ', async () => {
            const messageFactory = MockMessageFactory(sender, receiver, ds);
            const message1 = await messageFactory.createEncryptedEnvelop(
                'hello dm3',
            );
            const message2 = await messageFactory.createEncryptedEnvelop(
                'hello world',
            );
            const message3 = await messageFactory.createEncryptedEnvelop(
                'hello bob',
            );

            const storageContext = getMockedStorageContext({
                editMessageBatchAsync: jest.fn(),
                storeMessageBatch: jest.fn(),
                storeMessage: jest.fn(),
                getMessages: jest.fn().mockResolvedValue([]),
                getNumberOfMessages: jest.fn().mockResolvedValue(0),
            });
            const conversationContext = getMockedConversationContext({
                selectedContact: getDefaultContract('max.eth'),
                contacts: [getDefaultContract('alice.eth')],
            });
            const deliveryServiceContext = getMockedDeliveryServiceContext({
                onNewMessage: (cb: Function) => {
                    console.log('on new message');
                },
                fetchNewMessages: jest
                    .fn()
                    .mockResolvedValue([message1, message2, message3]),
                syncAcknowledgment: jest.fn(),
                removeOnNewMessageListener: jest.fn(),
            });
            const authContext = getMockedAuthContext({
                profileKeys: receiver.profileKeys,
                account: {
                    ensName: 'bob.eth',
                    profile: {
                        deliveryServices: ['ds.eth'],
                        publicEncryptionKey: '',
                        publicSigningKey: '',
                    },
                },
            });
            const tldContext = getMockedTldContext({});

            const wrapper = ({ children }: { children: any }) => (
                <>
                    <AuthContext.Provider value={authContext}>
                        <TLDContext.Provider value={tldContext}>
                            <StorageContext.Provider value={storageContext}>
                                <ConversationContext.Provider
                                    value={conversationContext}
                                >
                                    <DeliveryServiceContext.Provider
                                        value={deliveryServiceContext}
                                    >
                                        {children}
                                    </DeliveryServiceContext.Provider>
                                </ConversationContext.Provider>
                            </StorageContext.Provider>
                        </TLDContext.Provider>
                    </AuthContext.Provider>
                </>
            );

            const { result } = renderHook(() => useMessage(), {
                wrapper,
            });
            //Wait until bobs messages have been initialized
            await waitFor(
                () =>
                    result.current.contactIsLoading('alice.eth') === false &&
                    result.current.messages['alice.eth'].length > 0,
            );

            expect(result.current.contactIsLoading('alice.eth')).toBe(false);
            expect(result.current.messages['alice.eth'].length).toBe(3);
        });
    });
});
