import {
    Conversation,
    StorageEnvelopContainer,
} from '@dm3-org/dm3-lib-storage';
import {
    MockDeliveryServiceProfile,
    MockMessageFactory,
    MockedUserProfile,
    getMockDeliveryServiceProfile,
    mockUserProfile,
} from '@dm3-org/dm3-lib-test-helper';
import '@testing-library/jest-dom';
import { act, renderHook, waitFor } from '@testing-library/react';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { ethers } from 'ethers';
import { AuthContext, AuthContextType } from '../../context/AuthContext';
import {
    DeliveryServiceContext,
    DeliveryServiceContextType,
} from '../../context/DeliveryServiceContext';
import {
    MainnetProviderContext,
    MainnetProviderContextType,
} from '../../context/ProviderContext';
import {
    StorageContext,
    StorageContextType,
} from '../../context/StorageContext';
import { TLDContext, TLDContextProvider } from '../../context/TLDContext';
import { getMockedAuthContext } from '../../context/testHelper/getMockedAuthContext';
import { getMockedDeliveryServiceContext } from '../../context/testHelper/getMockedDeliveryServiceContext';
import {
    DEFAULT_DM3_CONFIGURATION,
    getMockedDm3Configuration,
} from '../../context/testHelper/getMockedDm3Configuration';
import { getMockedMainnetProviderContext } from '../../context/testHelper/getMockedMainnetProviderContext';
import { getMockedStorageContext } from '../../context/testHelper/getMockedStorageContext';
import { getMockedTldContext } from '../../context/testHelper/getMockedTldContext';
import { DM3Configuration } from '../../widget';
import { useConversation } from './useConversation';

describe('useConversation hook test cases', () => {
    let sender: MockedUserProfile;
    let receiver: MockedUserProfile;
    let ds1: MockDeliveryServiceProfile;
    let ds2: MockDeliveryServiceProfile;

    let axiosMock: MockAdapter;

    beforeEach(async () => {
        sender = await mockUserProfile(
            ethers.Wallet.createRandom(),
            'alice.eth',
            ['ds1.eth', 'ds2.eth'],
        );
        receiver = await mockUserProfile(
            ethers.Wallet.createRandom(),
            'bob.eth',
            ['ds1.eth'],
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

    describe('hide contact', () => {
        it('Should select a contact', async () => {
            const authContext: AuthContextType = getMockedAuthContext({
                account: {
                    ensName: 'alice.eth',
                    profile: {
                        deliveryServices: ['ds.eth'],
                        publicEncryptionKey: '',
                        publicSigningKey: '',
                    },
                },
            });

            const storageContext: StorageContextType = getMockedStorageContext({
                getConversations: function (
                    page: number,
                ): Promise<Conversation[]> {
                    return Promise.resolve([]);
                },
                addConversationAsync: jest.fn(),
                toggleHideContactAsync: jest.fn(),
                initialized: true,
            });
            const deliveryServiceContext: DeliveryServiceContextType =
                getMockedDeliveryServiceContext({
                    fetchIncomingMessages: function (ensName: string) {
                        return Promise.resolve([]);
                    },
                    getDeliveryServiceProperties: function (): Promise<any[]> {
                        return Promise.resolve([{ sizeLimit: 0 }]);
                    },
                    isInitialized: true,
                });

            const tldContext = getMockedTldContext({
                resolveTLDtoAlias: async (alias: string) => {
                    return CONTACT_NAME;
                },
            });

            const wrapper = ({ children }: { children: any }) => (
                <>
                    <AuthContext.Provider value={authContext}>
                        <TLDContext.Provider value={tldContext}>
                            <StorageContext.Provider value={storageContext}>
                                <DeliveryServiceContext.Provider
                                    value={deliveryServiceContext}
                                >
                                    {children}
                                </DeliveryServiceContext.Provider>
                            </StorageContext.Provider>
                        </TLDContext.Provider>
                    </AuthContext.Provider>
                </>
            );
            const { result } = renderHook(() => useConversation(config), {
                wrapper,
            });
            await act(async () => result.current.addConversation(CONTACT_NAME));
            expect(result.current.selectedContact).toBe(undefined);
            await act(async () =>
                result.current.setSelectedContactName(CONTACT_NAME),
            );
            await waitFor(() => {
                const { selectedContact } = result.current;
                expect(selectedContact?.contactDetails.account.ensName).toBe(
                    CONTACT_NAME,
                );
            });
        });

        it('Should unselect a contact', async () => {
            const authContext: AuthContextType = getMockedAuthContext({
                account: {
                    ensName: 'alice.eth',
                    profile: {
                        deliveryServices: ['ds.eth'],
                        publicEncryptionKey: '',
                        publicSigningKey: '',
                    },
                },
            });

            const storageContext: StorageContextType = getMockedStorageContext({
                getConversations: function (
                    page: number,
                ): Promise<Conversation[]> {
                    return Promise.resolve([]);
                },
                addConversationAsync: jest.fn(),
                toggleHideContactAsync: jest.fn(),
                initialized: true,
            });
            const deliveryServiceContext: DeliveryServiceContextType =
                getMockedDeliveryServiceContext({
                    fetchIncomingMessages: function (ensName: string) {
                        return Promise.resolve([]);
                    },
                    getDeliveryServiceProperties: function (): Promise<any[]> {
                        return Promise.resolve([{ sizeLimit: 0 }]);
                    },
                    isInitialized: true,
                });

            const tldContext = getMockedTldContext({
                resolveTLDtoAlias: async (alias: string) => {
                    return CONTACT_NAME;
                },
            });

            const wrapper = ({ children }: { children: any }) => (
                <>
                    <AuthContext.Provider value={authContext}>
                        <TLDContext.Provider value={tldContext}>
                            <StorageContext.Provider value={storageContext}>
                                <DeliveryServiceContext.Provider
                                    value={deliveryServiceContext}
                                >
                                    {children}
                                </DeliveryServiceContext.Provider>
                            </StorageContext.Provider>
                        </TLDContext.Provider>
                    </AuthContext.Provider>
                </>
            );
            const { result } = renderHook(() => useConversation(config), {
                wrapper,
            });
            await act(async () => result.current.addConversation(CONTACT_NAME));
            await act(async () =>
                result.current.setSelectedContactName(CONTACT_NAME),
            );
            await waitFor(() => {
                const { selectedContact } = result.current;
                expect(selectedContact?.contactDetails.account.ensName).toBe(
                    CONTACT_NAME,
                );
            });
            await act(async () =>
                result.current.setSelectedContactName(undefined),
            );
            await waitFor(() =>
                expect(result.current.selectedContact).toBe(undefined),
            );
        });

        it('Should hide a contact', async () => {
            const authContext: AuthContextType = getMockedAuthContext({
                account: {
                    ensName: 'alice.eth',
                    profile: {
                        deliveryServices: ['ds.eth'],
                        publicEncryptionKey: '',
                        publicSigningKey: '',
                    },
                },
            });

            const storageContext: StorageContextType = getMockedStorageContext({
                getConversations: function (
                    page: number,
                ): Promise<Conversation[]> {
                    return Promise.resolve([]);
                },
                addConversationAsync: jest.fn(),
                toggleHideContactAsync: jest.fn(),
                initialized: true,
            });
            const deliveryServiceContext: DeliveryServiceContextType =
                getMockedDeliveryServiceContext({
                    fetchIncomingMessages: function (ensName: string) {
                        return Promise.resolve([]);
                    },
                    getDeliveryServiceProperties: function (): Promise<any[]> {
                        return Promise.resolve([{ sizeLimit: 0 }]);
                    },
                    isInitialized: true,
                });

            const tldContext = getMockedTldContext({
                resolveTLDtoAlias: async (alias: string) => {
                    return CONTACT_NAME;
                },
            });

            const wrapper = ({ children }: { children: any }) => (
                <>
                    <AuthContext.Provider value={authContext}>
                        <TLDContext.Provider value={tldContext}>
                            <StorageContext.Provider value={storageContext}>
                                <DeliveryServiceContext.Provider
                                    value={deliveryServiceContext}
                                >
                                    {children}
                                </DeliveryServiceContext.Provider>
                            </StorageContext.Provider>
                        </TLDContext.Provider>
                    </AuthContext.Provider>
                </>
            );
            const { result } = renderHook(() => useConversation(config), {
                wrapper,
            });
            await act(async () => result.current.addConversation(CONTACT_NAME));
            await waitFor(() =>
                expect(result.current.contacts[0].isHidden).toBe(false),
            );
            await act(async () => result.current.hideContact(CONTACT_NAME));
            await waitFor(() =>
                expect(result.current.contacts[0].isHidden).toBe(true),
            );
        });

        it('Should unhide a contact', async () => {
            const authContext: AuthContextType = getMockedAuthContext({
                account: {
                    ensName: 'alice.eth',
                    profile: {
                        deliveryServices: ['ds.eth'],
                        publicEncryptionKey: '',
                        publicSigningKey: '',
                    },
                },
            });

            const storageContext: StorageContextType = getMockedStorageContext({
                getConversations: function (
                    page: number,
                ): Promise<Conversation[]> {
                    return Promise.resolve([]);
                },
                addConversationAsync: jest.fn(),
                toggleHideContactAsync: jest.fn(),
                initialized: true,
            });
            const deliveryServiceContext: DeliveryServiceContextType =
                getMockedDeliveryServiceContext({
                    fetchIncomingMessages: function (ensName: string) {
                        return Promise.resolve([]);
                    },
                    getDeliveryServiceProperties: function (): Promise<any[]> {
                        return Promise.resolve([{ sizeLimit: 0 }]);
                    },
                    isInitialized: true,
                });

            const tldContext = getMockedTldContext({
                resolveTLDtoAlias: async (alias: string) => {
                    return CONTACT_NAME;
                },
            });

            const wrapper = ({ children }: { children: any }) => (
                <>
                    <AuthContext.Provider value={authContext}>
                        <TLDContext.Provider value={tldContext}>
                            <StorageContext.Provider value={storageContext}>
                                <DeliveryServiceContext.Provider
                                    value={deliveryServiceContext}
                                >
                                    {children}
                                </DeliveryServiceContext.Provider>
                            </StorageContext.Provider>
                        </TLDContext.Provider>
                    </AuthContext.Provider>
                </>
            );
            const { result } = renderHook(() => useConversation(config), {
                wrapper,
            });

            await act(async () => result.current.addConversation(CONTACT_NAME));
            await act(async () => result.current.hideContact(CONTACT_NAME));
            await waitFor(() =>
                expect(result.current.contacts[0].isHidden).toBe(true),
            );
            await act(async () =>
                result.current.unhideContact(result.current.contacts[0]),
            );
            await waitFor(() =>
                expect(result.current.contacts[0].isHidden).toBe(false),
            );
        });
    });

    describe('load more conversations', () => {
        it('Should load more conversations', async () => {
            const authContext: AuthContextType = getMockedAuthContext({
                account: {
                    ensName: 'alice.eth',
                    profile: {
                        deliveryServices: ['ds.eth'],
                        publicEncryptionKey: '',
                        publicSigningKey: '',
                    },
                },
            });

            const storageContext: StorageContextType = getMockedStorageContext({
                getConversations: function (
                    pageSize: number,
                    offset: number,
                ): Promise<Conversation[]> {
                    return Promise.resolve(
                        Array.from({ length: pageSize }, (_, i) => {
                            return {
                                //Use offset here to create a distinct contactEnsName
                                contactEnsName: 'contact ' + i + offset,
                                contactProfileLocation: [],
                                isHidden: false,
                                previewMessage: undefined,
                                updatedAt: 0,
                            };
                        }),
                    );
                },
                addConversationAsync: jest.fn(),
                initialized: true,
            });
            const deliveryServiceContext: DeliveryServiceContextType =
                getMockedDeliveryServiceContext({
                    fetchIncomingMessages: function (ensName: string) {
                        return Promise.resolve([]);
                    },
                    getDeliveryServiceProperties: function (): Promise<any[]> {
                        return Promise.resolve([{ sizeLimit: 0 }]);
                    },
                    isInitialized: true,
                });

            const wrapper = ({ children }: { children: any }) => (
                <>
                    <AuthContext.Provider value={authContext}>
                        <StorageContext.Provider value={storageContext}>
                            <DeliveryServiceContext.Provider
                                value={deliveryServiceContext}
                            >
                                {children}
                            </DeliveryServiceContext.Provider>
                        </StorageContext.Provider>
                    </AuthContext.Provider>
                </>
            );

            const { result } = renderHook(() => useConversation(config), {
                wrapper,
            });

            await waitFor(() => result.current.initialized);
            await waitFor(() => result.current.contacts.length > 1);
            expect(result.current.contacts.length).toBe(10);

            await act(async () => result.current.loadMoreConversations());
            await waitFor(() => result.current.contacts.length > 10);
            expect(result.current.contacts.length).toBe(20);
        });
    });

    describe('initialize', () => {
        it('reads conversations from storage', async () => {
            const authContext: AuthContextType = getMockedAuthContext({
                account: {
                    ensName: 'alice.eth',
                    profile: {
                        deliveryServices: ['ds.eth'],
                        publicEncryptionKey: '',
                        publicSigningKey: '',
                    },
                },
            });

            const storageContext: StorageContextType = getMockedStorageContext({
                getConversations: function (
                    page: number,
                    offset: number,
                ): Promise<Conversation[]> {
                    return Promise.resolve([
                        {
                            contactEnsName: 'max.eth',
                            contactProfileLocation: [],
                            previewMessage: undefined,
                            isHidden: false,
                            updatedAt: 0,
                        },
                    ]);
                },
                addConversationAsync: jest.fn(),
                initialized: true,
            });
            const deliveryServiceContext: DeliveryServiceContextType =
                getMockedDeliveryServiceContext({
                    fetchIncomingMessages: function (ensName: string) {
                        return Promise.resolve([]);
                    },
                    getDeliveryServiceProperties: function (): Promise<any[]> {
                        return Promise.resolve([{ sizeLimit: 0 }]);
                    },
                    isInitialized: true,
                });

            const wrapper = ({ children }: { children: any }) => (
                <>
                    <AuthContext.Provider value={authContext}>
                        <StorageContext.Provider value={storageContext}>
                            <DeliveryServiceContext.Provider
                                value={deliveryServiceContext}
                            >
                                {children}
                            </DeliveryServiceContext.Provider>
                        </StorageContext.Provider>
                    </AuthContext.Provider>
                </>
            );

            const { result } = renderHook(() => useConversation(config), {
                wrapper,
            });
            await waitFor(() => expect(result.current.initialized).toBe(true));

            const conversations = result.current.contacts;

            expect(conversations.length).toBe(1);
            expect(conversations[0].contactDetails.account.ensName).toBe(
                'max.eth',
            );
        });
        it('use resolved tld alias name to store contact', async () => {
            const authContext: AuthContextType = getMockedAuthContext({
                account: {
                    ensName: receiver.account.ensName,
                    profile: {
                        deliveryServices: [ds1.address],
                        publicEncryptionKey: '',
                        publicSigningKey: '',
                    },
                },
            });

            const storageContext: StorageContextType = getMockedStorageContext({
                getConversations: function (
                    page: number,
                    offset: number,
                ): Promise<Conversation[]> {
                    return Promise.resolve([]);
                },
                addConversationAsync: jest.fn(),
                initialized: true,
            });

            const messageFactory = MockMessageFactory(sender, receiver, ds1);
            const envelope = await messageFactory.createEnvelop(
                'Hello from sender',
            );

            const deliveryServiceContext: DeliveryServiceContextType =
                getMockedDeliveryServiceContext({
                    fetchIncomingMessages: function (ensName: string) {
                        return Promise.resolve([envelope]);
                    },
                    getDeliveryServiceProperties: function (): Promise<any[]> {
                        return Promise.resolve([{ sizeLimit: 0 }]);
                    },
                    isInitialized: true,
                });

            const tldContext = getMockedTldContext({
                resolveTLDtoAlias: async (alias: string) => {
                    if (alias === sender.account.ensName) {
                        return 'alias.name.eth';
                    }
                    return alias;
                },
            });

            const wrapper = ({ children }: { children: any }) => (
                <>
                    <AuthContext.Provider value={authContext}>
                        <TLDContext.Provider value={tldContext}>
                            <StorageContext.Provider value={storageContext}>
                                <DeliveryServiceContext.Provider
                                    value={deliveryServiceContext}
                                >
                                    {children}
                                </DeliveryServiceContext.Provider>
                            </StorageContext.Provider>
                        </TLDContext.Provider>
                    </AuthContext.Provider>
                </>
            );

            const { result } = renderHook(() => useConversation(config), {
                wrapper,
            });
            await waitFor(() => expect(result.current.initialized).toBe(true));

            const conversations = result.current.contacts;

            expect(conversations.length).toBe(1);
            expect(conversations[0].contactDetails.account.ensName).toBe(
                'alias.name.eth',
            );
        });
        it('has last message attached as previewMessage', async () => {
            const authContext: AuthContextType = getMockedAuthContext({
                account: {
                    ensName: 'alice.eth',
                    profile: {
                        deliveryServices: ['ds.eth'],
                        publicEncryptionKey: '',
                        publicSigningKey: '',
                    },
                },
            });

            const storageContext: StorageContextType = getMockedStorageContext({
                getConversations: function (
                    page: number,
                    offset: number,
                ): Promise<Conversation[]> {
                    return Promise.resolve([
                        {
                            contactEnsName: 'max.eth',
                            contactProfileLocation: [],
                            isHidden: false,
                            previewMessage: undefined,
                            updatedAt: 0,
                        },
                        {
                            contactEnsName: 'bob.eth',
                            contactProfileLocation: [],
                            previewMessage: {
                                envelop: {
                                    message: {
                                        message: 'Hello from Bob',
                                    },
                                },
                                messageState: 0,
                            } as StorageEnvelopContainer,
                            isHidden: false,
                            updatedAt: 0,
                        },
                    ]);
                },
                addConversationAsync: jest.fn(),
                initialized: true,
            });
            const deliveryServiceContext: DeliveryServiceContextType =
                getMockedDeliveryServiceContext({
                    fetchIncomingMessages: function (ensName: string) {
                        return Promise.resolve([]);
                    },
                    getDeliveryServiceProperties: function (): Promise<any[]> {
                        return Promise.resolve([{ sizeLimit: 0 }]);
                    },
                    isInitialized: true,
                });

            const wrapper = ({ children }: { children: any }) => (
                <>
                    <AuthContext.Provider value={authContext}>
                        <StorageContext.Provider value={storageContext}>
                            <DeliveryServiceContext.Provider
                                value={deliveryServiceContext}
                            >
                                {children}
                            </DeliveryServiceContext.Provider>
                        </StorageContext.Provider>
                    </AuthContext.Provider>
                </>
            );

            const { result } = renderHook(() => useConversation(config), {
                wrapper,
            });
            await waitFor(() => expect(result.current.initialized).toBe(true));

            const conversations = result.current.contacts;

            expect(conversations.length).toBe(2);
            expect(conversations[0].contactDetails.account.ensName).toBe(
                'max.eth',
            );
            expect(conversations[1].contactDetails.account.ensName).toBe(
                'bob.eth',
            );
            expect(conversations[1].contactDetails.account.ensName).toBe(
                'bob.eth',
            );
        });
        it('add default contact if specified in config ', async () => {
            const configurationContext = getMockedDm3Configuration({
                dm3Configuration: {
                    ...DEFAULT_DM3_CONFIGURATION,
                    defaultContact: 'mydefaultcontract.eth',
                },
            });
            const config: DM3Configuration =
                configurationContext.dm3Configuration!;
            const authContext: AuthContextType = getMockedAuthContext({
                account: {
                    ensName: 'alice.eth',
                    profile: {
                        deliveryServices: ['ds.eth'],
                        publicEncryptionKey: '',
                        publicSigningKey: '',
                    },
                },
            });

            const storageContext: StorageContextType = getMockedStorageContext({
                getConversations: function (
                    page: number,
                ): Promise<Conversation[]> {
                    return Promise.resolve([
                        {
                            contactEnsName: 'max.eth',
                            contactProfileLocation: [],
                            isHidden: false,
                            previewMessage: undefined,
                            updatedAt: 0,
                        },
                    ]);
                },
                addConversationAsync: jest.fn(),
                initialized: true,
            });
            const deliveryServiceContext: DeliveryServiceContextType =
                getMockedDeliveryServiceContext({
                    fetchIncomingMessages: function (ensName: string) {
                        return Promise.resolve([]);
                    },
                    getDeliveryServiceProperties: function (): Promise<any[]> {
                        return Promise.resolve([{ sizeLimit: 0 }]);
                    },
                    isInitialized: true,
                });

            const tldContext = getMockedTldContext({
                resolveTLDtoAlias: async (alias: string) => {
                    if (alias === 'mydefaultcontract.eth') {
                        return 'mydefaultcontract.eth';
                    }
                    return alias;
                },
            });

            const wrapper = ({ children }: { children: any }) => (
                <>
                    <AuthContext.Provider value={authContext}>
                        <TLDContext.Provider value={tldContext}>
                            <StorageContext.Provider value={storageContext}>
                                <DeliveryServiceContext.Provider
                                    value={deliveryServiceContext}
                                >
                                    {children}
                                </DeliveryServiceContext.Provider>
                            </StorageContext.Provider>
                        </TLDContext.Provider>
                    </AuthContext.Provider>
                </>
            );

            const { result } = renderHook(() => useConversation(config), {
                wrapper,
            });
            await waitFor(() => expect(result.current.initialized).toBe(true));
            const conversations = result.current.contacts;
            expect(conversations.length).toBe(2);
            expect(conversations[0].contactDetails.account.ensName).toBe(
                'mydefaultcontract.eth',
            );
            expect(conversations[1].contactDetails.account.ensName).toBe(
                'max.eth',
            );
        });
        it('default contact should only appear once when loaded from config and storage', async () => {
            const configurationContext = getMockedDm3Configuration({
                dm3Configuration: {
                    ...DEFAULT_DM3_CONFIGURATION,
                    defaultContact: 'mydefaultcontract.eth',
                },
            });
            const config: DM3Configuration =
                configurationContext.dm3Configuration!;
            const authContext: AuthContextType = getMockedAuthContext({
                account: {
                    ensName: 'alice.eth',
                    profile: {
                        deliveryServices: ['ds.eth'],
                        publicEncryptionKey: '',
                        publicSigningKey: '',
                    },
                },
            });

            const storageContext: StorageContextType = getMockedStorageContext({
                getConversations: function (
                    page: number,
                ): Promise<Conversation[]> {
                    return Promise.resolve([
                        {
                            contactEnsName: 'max.eth',
                            contactProfileLocation: [],
                            isHidden: false,
                            previewMessage: undefined,
                            updatedAt: 0,
                        },
                        {
                            contactEnsName: 'mydefaultcontract.eth',
                            contactProfileLocation: [],
                            isHidden: false,
                            previewMessage: undefined,
                            updatedAt: 0,
                        },
                    ]);
                },
                addConversationAsync: jest.fn(),
                initialized: true,
            });
            const deliveryServiceContext: DeliveryServiceContextType =
                getMockedDeliveryServiceContext({
                    fetchIncomingMessages: function (ensName: string) {
                        return Promise.resolve([]);
                    },
                    getDeliveryServiceProperties: function (): Promise<any[]> {
                        return Promise.resolve([{ sizeLimit: 0 }]);
                    },
                    isInitialized: true,
                });

            const tldContext = getMockedTldContext({
                resolveTLDtoAlias: async (alias: string) => {
                    if (alias === 'mydefaultcontract.eth') {
                        return 'mydefaultcontract.eth';
                    }
                    return alias;
                },
            });

            const wrapper = ({ children }: { children: any }) => (
                <>
                    <AuthContext.Provider value={authContext}>
                        <TLDContext.Provider value={tldContext}>
                            <StorageContext.Provider value={storageContext}>
                                <DeliveryServiceContext.Provider
                                    value={deliveryServiceContext}
                                >
                                    {children}
                                </DeliveryServiceContext.Provider>
                            </StorageContext.Provider>
                        </TLDContext.Provider>
                    </AuthContext.Provider>
                </>
            );

            const { result } = renderHook(() => useConversation(config), {
                wrapper,
            });
            await waitFor(() => expect(result.current.initialized).toBe(true));
            const conversations = result.current.contacts;
            expect(conversations.length).toBe(2);
            expect(conversations[0].contactDetails.account.ensName).toBe(
                'mydefaultcontract.eth',
            );
            expect(conversations[1].contactDetails.account.ensName).toBe(
                'max.eth',
            );
        });
        it('hidden contact should appear as hidden in the conversation list', async () => {
            const configurationContext = getMockedDm3Configuration({
                dm3Configuration: {
                    ...DEFAULT_DM3_CONFIGURATION,
                    defaultContact: 'mydefaultcontract.eth',
                },
            });
            const config: DM3Configuration =
                configurationContext.dm3Configuration!;
            const authContext: AuthContextType = getMockedAuthContext({
                account: {
                    ensName: 'alice.eth',
                    profile: {
                        deliveryServices: ['ds.eth'],
                        publicEncryptionKey: '',
                        publicSigningKey: '',
                    },
                },
            });

            const storageContext: StorageContextType = getMockedStorageContext({
                getConversations: function (
                    page: number,
                ): Promise<Conversation[]> {
                    return Promise.resolve([
                        {
                            contactEnsName: 'ron.eth',
                            contactProfileLocation: [],
                            isHidden: true,
                            previewMessage: undefined,
                            updatedAt: 0,
                        },
                        {
                            contactEnsName: 'max.eth',
                            contactProfileLocation: [],
                            isHidden: false,
                            previewMessage: undefined,
                            updatedAt: 0,
                        },
                        {
                            contactEnsName: 'mydefaultcontract.eth',
                            contactProfileLocation: [],
                            isHidden: false,
                            previewMessage: undefined,
                            updatedAt: 0,
                        },
                    ]);
                },
                addConversationAsync: jest.fn(),
                initialized: true,
            });
            const deliveryServiceContext: DeliveryServiceContextType =
                getMockedDeliveryServiceContext({
                    fetchIncomingMessages: function (ensName: string) {
                        return Promise.resolve([]);
                    },
                    getDeliveryServiceProperties: function (): Promise<any[]> {
                        return Promise.resolve([{ sizeLimit: 0 }]);
                    },
                    isInitialized: true,
                });

            const tldContext = getMockedTldContext({
                resolveTLDtoAlias: async (alias: string) => {
                    if (alias === 'mydefaultcontract.eth') {
                        return 'mydefaultcontract.eth';
                    }
                    return alias;
                },
            });

            const wrapper = ({ children }: { children: any }) => (
                <>
                    <AuthContext.Provider value={authContext}>
                        <TLDContext.Provider value={tldContext}>
                            <StorageContext.Provider value={storageContext}>
                                <DeliveryServiceContext.Provider
                                    value={deliveryServiceContext}
                                >
                                    {children}
                                </DeliveryServiceContext.Provider>
                            </StorageContext.Provider>
                        </TLDContext.Provider>
                    </AuthContext.Provider>
                </>
            );

            const { result } = renderHook(() => useConversation(config), {
                wrapper,
            });
            await waitFor(() => expect(result.current.initialized).toBe(true));
            const conversations = result.current.contacts;

            expect(conversations.length).toBe(3);

            expect(conversations[0].contactDetails.account.ensName).toBe(
                'mydefaultcontract.eth',
            );
            expect(conversations[1].contactDetails.account.ensName).toBe(
                'ron.eth',
            );
            expect(conversations[2].contactDetails.account.ensName).toBe(
                'max.eth',
            );

            expect(conversations[0].isHidden).toBe(false);
            expect(conversations[1].isHidden).toBe(true);
            expect(conversations[2].isHidden).toBe(false);
        });
    });
    describe('add Conversation', () => {
        it('dont add own address as conversation', async () => {
            const authContext: AuthContextType = getMockedAuthContext({
                account: {
                    ensName: 'alice.eth',
                    profile: {
                        deliveryServices: ['ds.eth'],
                        publicEncryptionKey: '',
                        publicSigningKey: '',
                    },
                },
            });

            const storageContext: StorageContextType = getMockedStorageContext({
                getConversations: function (
                    page: number,
                ): Promise<Conversation[]> {
                    return Promise.resolve([
                        {
                            contactEnsName: 'max.eth',
                            contactProfileLocation: [],
                            isHidden: false,
                            previewMessage: undefined,
                            updatedAt: 0,
                        },
                    ]);
                },
                addConversationAsync: jest.fn(),
                initialized: true,
            });
            const deliveryServiceContext: DeliveryServiceContextType =
                getMockedDeliveryServiceContext({
                    fetchIncomingMessages: function (ensName: string) {
                        return Promise.resolve([]);
                    },
                    getDeliveryServiceProperties: function (): Promise<any[]> {
                        return Promise.resolve([{ sizeLimit: 0 }]);
                    },
                    isInitialized: true,
                });

            const tldContext = getMockedTldContext({
                resolveTLDtoAlias: async (alias: string) => {
                    return alias;
                },
            });

            const wrapper = ({ children }: { children: any }) => (
                <>
                    <AuthContext.Provider value={authContext}>
                        <TLDContext.Provider value={tldContext}>
                            <StorageContext.Provider value={storageContext}>
                                <DeliveryServiceContext.Provider
                                    value={deliveryServiceContext}
                                >
                                    {children}
                                </DeliveryServiceContext.Provider>
                            </StorageContext.Provider>
                        </TLDContext.Provider>
                    </AuthContext.Provider>
                </>
            );

            const { result } = renderHook(() => useConversation(config), {
                wrapper,
            });
            await waitFor(() => expect(result.current.initialized).toBe(true));
            //adding a different address to a conversation is possible
            await waitFor(() => result.current.addConversation('bob.eth'));
            //adding own address to a conversation is not possible
            await waitFor(() => result.current.addConversation('alice.eth'));

            const conversations = result.current.contacts;
            expect(conversations.length).toBe(2);
            expect(conversations[0].contactDetails.account.ensName).toBe(
                'bob.eth',
            );
            expect(conversations[1].contactDetails.account.ensName).toBe(
                'max.eth',
            );
        });
        it('Should add multiple contacts', async () => {
            const authContext: AuthContextType = getMockedAuthContext({
                account: {
                    ensName: 'alice.eth',
                    profile: {
                        deliveryServices: ['ds.eth'],
                        publicEncryptionKey: '',
                        publicSigningKey: '',
                    },
                },
            });

            const storageContext: StorageContextType = getMockedStorageContext({
                getConversations: function (
                    page: number,
                ): Promise<Conversation[]> {
                    return Promise.resolve([]);
                },
                addConversationAsync: jest.fn(),
                initialized: true,
            });
            const deliveryServiceContext: DeliveryServiceContextType =
                getMockedDeliveryServiceContext({
                    fetchIncomingMessages: function (ensName: string) {
                        return Promise.resolve([]);
                    },
                    getDeliveryServiceProperties: function (): Promise<any[]> {
                        return Promise.resolve([{ sizeLimit: 0 }]);
                    },
                    isInitialized: true,
                });

            const tldContext = getMockedTldContext({
                resolveTLDtoAlias: async (alias: string) => {
                    if (alias === 'bob.eth') {
                        return 'bob.eth';
                    }
                    if (alias === 'liza.eth') {
                        return 'liza.eth';
                    }
                    if (alias === 'heroku.eth') {
                        return 'heroku.eth';
                    }
                    if (alias === 'samar.eth') {
                        return 'samar.eth';
                    }
                    return alias;
                },
            });

            const wrapper = ({ children }: { children: any }) => (
                <>
                    <AuthContext.Provider value={authContext}>
                        <TLDContext.Provider value={tldContext}>
                            <StorageContext.Provider value={storageContext}>
                                <DeliveryServiceContext.Provider
                                    value={deliveryServiceContext}
                                >
                                    {children}
                                </DeliveryServiceContext.Provider>
                            </StorageContext.Provider>
                        </TLDContext.Provider>
                    </AuthContext.Provider>
                </>
            );

            const { result } = renderHook(() => useConversation(config), {
                wrapper,
            });
            await act(async () => result.current.addConversation('bob.eth'));
            await act(async () => result.current.addConversation('liza.eth'));
            await act(async () => result.current.addConversation('heroku.eth'));
            await act(async () => result.current.addConversation('samar.eth'));
            await waitFor(() => expect(result.current.contacts.length).toBe(4));
        });
    });

    describe('hydrate contact', () => {
        it('fetches all deliveryService profiles of one contact', async () => {
            const authContext: AuthContextType = getMockedAuthContext({
                account: {
                    ensName: receiver.account.ensName,
                    profile: receiver.signedUserProfile.profile,
                },
            });

            const storageContext: StorageContextType = getMockedStorageContext({
                getConversations: function (
                    page: number,
                ): Promise<Conversation[]> {
                    return Promise.resolve([
                        {
                            contactEnsName: sender.account.ensName,
                            contactProfileLocation: [],
                            isHidden: false,
                            previewMessage: undefined,
                            updatedAt: 0,
                        },
                    ]);
                },
                initialized: true,
            });
            const deliveryServiceContext: DeliveryServiceContextType =
                getMockedDeliveryServiceContext({
                    fetchIncomingMessages: function (ensName: string) {
                        return Promise.resolve([]);
                    },
                    getDeliveryServiceProperties: function (): Promise<any[]> {
                        return Promise.resolve([{ sizeLimit: 0 }]);
                    },
                    isInitialized: true,
                });
            const mockProvider = {
                resolveName: () => {
                    return Promise.resolve(sender.address);
                },
                getResolver: (ensName: string) => {
                    console.log('mock resolver for ', ensName);
                    if (ensName === sender.account.ensName) {
                        return {
                            getText: () => sender.stringified,
                        } as unknown as ethers.providers.Resolver;
                    }
                    if (ensName === 'ds1.eth') {
                        return {
                            getText: () => ds1.stringified,
                        } as unknown as ethers.providers.Resolver;
                    }
                    if (ensName === 'ds2.eth') {
                        return {
                            getText: () => ds2.stringified,
                        } as unknown as ethers.providers.Resolver;
                    }

                    throw new Error(`mock provider unknown ensName ${ensName}`);
                },
            } as any as ethers.providers.JsonRpcProvider;

            const mainnetProviderContext: MainnetProviderContextType =
                getMockedMainnetProviderContext({
                    provider: mockProvider,
                });

            const wrapper = ({ children }: { children: any }) => (
                <>
                    <MainnetProviderContext.Provider
                        value={mainnetProviderContext}
                    >
                        <AuthContext.Provider value={authContext}>
                            <StorageContext.Provider value={storageContext}>
                                <DeliveryServiceContext.Provider
                                    value={deliveryServiceContext}
                                >
                                    {children}
                                </DeliveryServiceContext.Provider>
                            </StorageContext.Provider>
                        </AuthContext.Provider>
                    </MainnetProviderContext.Provider>
                </>
            );

            const { result } = renderHook(() => useConversation(config), {
                wrapper,
            });

            await waitFor(() => expect(result.current.initialized).toBe(true));

            await waitFor(() =>
                expect(
                    result.current.contacts[0].contactDetails
                        .deliveryServiceProfiles.length,
                ).toBe(2),
            );
            expect(
                result.current.contacts[0].contactDetails
                    .deliveryServiceProfiles[0],
            ).toStrictEqual(ds1.deliveryServiceProfile);

            expect(
                result.current.contacts[0].contactDetails
                    .deliveryServiceProfiles[1],
            ).toStrictEqual(ds2.deliveryServiceProfile);
        });
        it('fetches the sizeLimit of every deliveryService', async () => {
            axiosMock = new MockAdapter(axios);
            axiosMock.onPost('http://ds1.api/rpc').reply(200, {
                result: 1000,
            });
            axiosMock.onPost('http://ds2.api/rpc').reply(200, {
                result: 2000,
            });

            const authContext: AuthContextType = getMockedAuthContext({
                account: {
                    ensName: receiver.account.ensName,
                    profile: receiver.signedUserProfile.profile,
                },
            });

            const storageContext: StorageContextType = getMockedStorageContext({
                getConversations: function (
                    page: number,
                ): Promise<Conversation[]> {
                    return Promise.resolve([
                        {
                            contactEnsName: sender.account.ensName,
                            contactProfileLocation: [],
                            isHidden: false,
                            previewMessage: undefined,
                            updatedAt: 0,
                        },
                    ]);
                },
                initialized: true,
            });
            const deliveryServiceContext: DeliveryServiceContextType =
                getMockedDeliveryServiceContext({
                    fetchIncomingMessages: function (ensName: string) {
                        return Promise.resolve([]);
                    },
                    isInitialized: true,
                });
            const mockProvider = {
                resolveName: () => {
                    return Promise.resolve(sender.address);
                },
                getResolver: (ensName: string) => {
                    if (ensName === sender.account.ensName) {
                        return {
                            getText: () => sender.stringified,
                        } as unknown as ethers.providers.Resolver;
                    }
                    if (ensName === 'ds1.eth') {
                        return {
                            getText: () => ds1.stringified,
                        } as unknown as ethers.providers.Resolver;
                    }
                    if (ensName === 'ds2.eth') {
                        return {
                            getText: () => ds2.stringified,
                        } as unknown as ethers.providers.Resolver;
                    }

                    throw new Error(`mock provider unknown ensName ${ensName}`);
                },
            } as any as ethers.providers.JsonRpcProvider;

            const mainnetProvderContext: MainnetProviderContextType =
                getMockedMainnetProviderContext({
                    provider: mockProvider,
                });

            const wrapper = ({ children }: { children: any }) => (
                <>
                    <MainnetProviderContext.Provider
                        value={mainnetProvderContext}
                    >
                        <AuthContext.Provider value={authContext}>
                            <StorageContext.Provider value={storageContext}>
                                <DeliveryServiceContext.Provider
                                    value={deliveryServiceContext}
                                >
                                    {children}
                                </DeliveryServiceContext.Provider>
                            </StorageContext.Provider>
                        </AuthContext.Provider>
                    </MainnetProviderContext.Provider>
                </>
            );

            const { result } = renderHook(() => useConversation(config), {
                wrapper,
            });
            await waitFor(() => expect(result.current.initialized).toBe(true));

            //1000 is the sizelimit of the DS with the loweset tolerance. This should be set as the messageSizeLimit
            expect(result.current.contacts[0].messageSizeLimit).toEqual(1000);
        });
    });

    describe('conversation order', () => {
        it('initial loading of conversation list should be in DESC order of updatedAt property', async () => {
            const authContext: AuthContextType = getMockedAuthContext({
                account: {
                    ensName: 'alice.eth',
                    profile: {
                        deliveryServices: ['ds.eth'],
                        publicEncryptionKey: '',
                        publicSigningKey: '',
                    },
                },
            });

            const storageContext: StorageContextType = getMockedStorageContext({
                getConversations: function (
                    page: number,
                    offset: number,
                ): Promise<Conversation[]> {
                    return Promise.resolve([
                        {
                            contactEnsName: 'max.eth',
                            contactProfileLocation: [],
                            previewMessage: undefined,
                            isHidden: false,
                            updatedAt: new Date().getTime(),
                        },
                        {
                            contactEnsName: 'horo.eth',
                            contactProfileLocation: [],
                            previewMessage: undefined,
                            isHidden: false,
                            updatedAt: new Date().getTime() + 2000,
                        },
                    ]);
                },
                addConversationAsync: jest.fn(),
                initialized: true,
            });
            const deliveryServiceContext: DeliveryServiceContextType =
                getMockedDeliveryServiceContext({
                    fetchIncomingMessages: function (ensName: string) {
                        return Promise.resolve([]);
                    },
                    getDeliveryServiceProperties: function (): Promise<any[]> {
                        return Promise.resolve([{ sizeLimit: 0 }]);
                    },
                    isInitialized: true,
                });

            const wrapper = ({ children }: { children: any }) => (
                <>
                    <AuthContext.Provider value={authContext}>
                        <StorageContext.Provider value={storageContext}>
                            <DeliveryServiceContext.Provider
                                value={deliveryServiceContext}
                            >
                                {children}
                            </DeliveryServiceContext.Provider>
                        </StorageContext.Provider>
                    </AuthContext.Provider>
                </>
            );

            const { result } = renderHook(() => useConversation(config), {
                wrapper,
            });

            await waitFor(() => expect(result.current.initialized).toBe(true));

            const conversations = result.current.contacts;

            expect(conversations[0].updatedAt).toBeGreaterThan(
                conversations[1].updatedAt,
            );
        });

        it('updates conversation updatedAt property', async () => {
            const authContext: AuthContextType = getMockedAuthContext({
                account: {
                    ensName: 'alice.eth',
                    profile: {
                        deliveryServices: ['ds.eth'],
                        publicEncryptionKey: '',
                        publicSigningKey: '',
                    },
                },
            });

            const storageContext: StorageContextType = getMockedStorageContext({
                getConversations: function (
                    page: number,
                    offset: number,
                ): Promise<Conversation[]> {
                    return Promise.resolve([
                        {
                            contactEnsName: 'max.eth',
                            contactProfileLocation: [],
                            previewMessage: undefined,
                            isHidden: false,
                            updatedAt: 0,
                        },
                        {
                            contactEnsName: 'horo.eth',
                            contactProfileLocation: [],
                            previewMessage: undefined,
                            isHidden: false,
                            updatedAt: 0,
                        },
                    ]);
                },
                addConversationAsync: jest.fn(),
                initialized: true,
            });
            const deliveryServiceContext: DeliveryServiceContextType =
                getMockedDeliveryServiceContext({
                    fetchIncomingMessages: function (ensName: string) {
                        return Promise.resolve([]);
                    },
                    getDeliveryServiceProperties: function (): Promise<any[]> {
                        return Promise.resolve([{ sizeLimit: 0 }]);
                    },
                    isInitialized: true,
                });

            const wrapper = ({ children }: { children: any }) => (
                <>
                    <AuthContext.Provider value={authContext}>
                        <StorageContext.Provider value={storageContext}>
                            <DeliveryServiceContext.Provider
                                value={deliveryServiceContext}
                            >
                                {children}
                            </DeliveryServiceContext.Provider>
                        </StorageContext.Provider>
                    </AuthContext.Provider>
                </>
            );

            const { result } = renderHook(() => useConversation(config), {
                wrapper,
            });

            await waitFor(() => expect(result.current.initialized).toBe(true));

            // updating conversation updatedAt property
            await waitFor(() =>
                result.current.updateConversationList(
                    'max.eth',
                    new Date().getTime() + 10000,
                ),
            );

            const conversations = result.current.contacts;

            // after updating updatedAt property, max.eth will be latest contact updated
            expect(conversations[0].updatedAt).toBeGreaterThan(
                conversations[1].updatedAt,
            );
        });

        it('new conversation added should be at top in contact list', async () => {
            const authContext: AuthContextType = getMockedAuthContext({
                account: {
                    ensName: 'alice.eth',
                    profile: {
                        deliveryServices: ['ds.eth'],
                        publicEncryptionKey: '',
                        publicSigningKey: '',
                    },
                },
            });

            const storageContext: StorageContextType = getMockedStorageContext({
                getConversations: function (
                    page: number,
                    offset: number,
                ): Promise<Conversation[]> {
                    return Promise.resolve([
                        {
                            contactEnsName: 'max.eth',
                            contactProfileLocation: [],
                            previewMessage: undefined,
                            isHidden: false,
                            updatedAt: 0,
                        },
                    ]);
                },
                addConversationAsync: jest.fn(),
                initialized: true,
            });
            const deliveryServiceContext: DeliveryServiceContextType =
                getMockedDeliveryServiceContext({
                    fetchIncomingMessages: function (ensName: string) {
                        return Promise.resolve([]);
                    },
                    getDeliveryServiceProperties: function (): Promise<any[]> {
                        return Promise.resolve([{ sizeLimit: 0 }]);
                    },
                    isInitialized: true,
                });

            const tldContext = getMockedTldContext({
                resolveTLDtoAlias: async (alias: string) => {
                    return 'bob.eth';
                },
            });

            const wrapper = ({ children }: { children: any }) => (
                <>
                    <AuthContext.Provider value={authContext}>
                        <TLDContext.Provider value={tldContext}>
                            <StorageContext.Provider value={storageContext}>
                                <DeliveryServiceContext.Provider
                                    value={deliveryServiceContext}
                                >
                                    {children}
                                </DeliveryServiceContext.Provider>
                            </StorageContext.Provider>
                        </TLDContext.Provider>
                    </AuthContext.Provider>
                </>
            );

            const { result } = renderHook(() => useConversation(config), {
                wrapper,
            });

            await waitFor(() => result.current.addConversation('bob.eth'));

            const conversations = result.current.contacts;

            // new conversation added should be the first in contact list
            expect(conversations[0].contactDetails.account.ensName).toBe(
                'bob.eth',
            );
        });
    });
});
