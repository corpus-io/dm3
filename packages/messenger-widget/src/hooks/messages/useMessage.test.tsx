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
    MockMessageFactory,
    MockedUserProfile,
    getMockDeliveryServiceProfile,
    mockUserProfile,
} from '@dm3-org/dm3-lib-test-helper';
import { ethers } from 'ethers';

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

            const messageFactory = MockMessageFactory(
                sender,
                receiver,
                ds.profile,
            );
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

            const messageFactory = MockMessageFactory(
                sender,
                receiver,
                ds.profile,
            );
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

            const messageFactory = MockMessageFactory(
                sender,
                receiver,
                ds.profile,
            );
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
