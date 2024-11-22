import { StorageAPI } from '@dm3-org/dm3-lib-storage';
import {
    getMockDeliveryServiceProfile,
    MockDeliveryServiceProfile,
    MockedUserProfile,
    MockMessageFactory,
    mockUserProfile,
} from '@dm3-org/dm3-lib-test-helper';
import axios from 'axios';
import { ethers } from 'ethers';
import { Dm3Sdk, Dm3SdkConfig } from './Dm3Sdk';

import MockAdapter from 'axios-mock-adapter';
import { normalizeEnsName } from '@dm3-org/dm3-lib-profile';
import { ITLDResolver } from './tld/nameService/ITLDResolver';

describe('Dm3Sdk', () => {
    let alice: MockedUserProfile;
    let bob: MockedUserProfile;
    let karl: MockedUserProfile;

    //Axios mock to mock the http requests
    let axiosMock;

    let deliveryService: MockDeliveryServiceProfile;

    beforeEach(async () => {
        alice = await mockUserProfile(
            ethers.Wallet.createRandom(),
            'alice.up',
            ['test.io'],
        );
        bob = await mockUserProfile(ethers.Wallet.createRandom(), 'bob.up', [
            'test.io',
        ]);

        karl = await mockUserProfile(ethers.Wallet.createRandom(), 'karl.up', [
            'test.io',
        ]);

        deliveryService = await getMockDeliveryServiceProfile(
            ethers.Wallet.createRandom(),
            'http://localhost:3000',
        );
        axiosMock = new MockAdapter(axios);

        //Mock BackendConnector HttpRequests
        //Mock profileExistsOnDeliveryService
        axiosMock
            .onGet(
                `http://localhost:4060/profile/${normalizeEnsName(
                    alice.address,
                )}.addr.test`,
            )
            .reply(200);
        //Mock getChallenge
        axiosMock
            .onGet(
                `http://localhost:4060/auth/${normalizeEnsName(
                    alice.address,
                )}.addr.test`,
            )
            .reply(200, 'mock-challenge');

        //Mock getToken
        axiosMock
            .onPost(
                `http://localhost:4060/auth/${normalizeEnsName(
                    alice.address,
                )}.addr.test`,
            )
            .reply(200);
    });

    describe('conversations', () => {
        it('can add a conversation to the contact list', async () => {
            const mockTldResolver = {
                resolveTLDtoAlias: async () =>
                    `${normalizeEnsName(bob.address)}.addr.test`,
                resolveAliasToTLD: async () => 'bob.eth',
            } as unknown as ITLDResolver;

            const mockConfig: Dm3SdkConfig = {
                mainnetProvider: {} as ethers.providers.JsonRpcProvider,
                storageApi: {
                    addConversation: async () => {},
                } as unknown as StorageAPI,
                nonce: '1',
                defaultDeliveryService: 'test.io',
                addressEnsSubdomain: '.addr.test',
                userEnsSubdomain: '.user.test',
                resolverBackendUrl: 'resolver.io',
                backendUrl: 'http://localhost:4060',
                _tld: mockTldResolver,
            };

            const dm3 = await new Dm3Sdk(mockConfig).login({
                profileKeys: alice.profileKeys,
                profile: alice.signedUserProfile,
                accountAddress: alice.address,
            });

            await dm3.conversations.addConversation('bob.eth');
            expect(dm3.conversations.list.length).toBe(1);
            expect(dm3.conversations.list[0].contact.name).toBe('bob.eth');
        });
        it('can multiple conversations to the contact list', async () => {
            const mockTldResolver = {
                resolveTLDtoAlias: async (ensName: string) => {
                    if (ensName === 'alice.eth') {
                        return `${normalizeEnsName(alice.address)}.addr.test`;
                    }
                    if (ensName === 'bob.eth') {
                        return `${normalizeEnsName(bob.address)}.addr.test`;
                    }
                    return `${normalizeEnsName(karl.address)}.addr.test`;
                },
                resolveAliasToTLD: async (ensName: string) => {
                    if (
                        normalizeEnsName(ensName) ===
                        normalizeEnsName(alice.address) + '.addr.test'
                    ) {
                        return 'alice.eth';
                    }
                    if (
                        normalizeEnsName(ensName) ===
                        normalizeEnsName(bob.address) + '.addr.test'
                    ) {
                        return 'bob.eth';
                    }
                    return 'karl.eth';
                },
            } as unknown as ITLDResolver;

            const mockConfig: Dm3SdkConfig = {
                mainnetProvider: {} as ethers.providers.JsonRpcProvider,
                storageApi: {
                    addConversation: async () => {},
                } as unknown as StorageAPI,
                nonce: '1',
                defaultDeliveryService: 'test.io',
                addressEnsSubdomain: '.addr.test',
                userEnsSubdomain: '.user.test',
                resolverBackendUrl: 'resolver.io',
                backendUrl: 'http://localhost:4060',
                _tld: mockTldResolver,
            };

            const dm3 = await new Dm3Sdk(mockConfig).login({
                profileKeys: alice.profileKeys,
                profile: alice.signedUserProfile,
                accountAddress: alice.address,
            });

            await dm3.conversations.addConversation('bob.eth');
            await dm3.conversations.addConversation('karl.eth');

            expect(dm3.conversations.list.length).toBe(2);
            expect(dm3.conversations.list[0].contact.name).toBe('bob.eth');
            expect(dm3.conversations.list[1].contact.name).toBe('karl.eth');
        });
        it('dont add duplicate conversations', async () => {
            const mockTldResolver = {
                resolveTLDtoAlias: async () =>
                    `${normalizeEnsName(bob.address)}.addr.test`,
                resolveAliasToTLD: async () => 'bob.eth',
            } as unknown as ITLDResolver;

            const mockConfig: Dm3SdkConfig = {
                mainnetProvider: {} as ethers.providers.JsonRpcProvider,
                storageApi: {
                    addConversation: async () => {},
                } as unknown as StorageAPI,
                nonce: '1',
                defaultDeliveryService: 'test.io',
                addressEnsSubdomain: '.addr.test',
                userEnsSubdomain: '.user.test',
                resolverBackendUrl: 'resolver.io',
                backendUrl: 'http://localhost:4060',
                _tld: mockTldResolver,
            };

            const dm3 = await new Dm3Sdk(mockConfig).login({
                profileKeys: alice.profileKeys,
                profile: alice.signedUserProfile,
                accountAddress: alice.address,
            });

            await dm3.conversations.addConversation('bob.eth');
            await dm3.conversations.addConversation('bob.eth');
            expect(dm3.conversations.list.length).toBe(1);
            expect(dm3.conversations.list[0].contact.name).toBe('bob.eth');
        });
    });

    describe('Messages', () => {
        it('can send a message', async () => {
            const mockTldResolver = {
                resolveTLDtoAlias: async () =>
                    `${normalizeEnsName(bob.address)}.addr.test`,
                resolveAliasToTLD: async () => 'bob.eth',
            } as unknown as ITLDResolver;

            const mockConfig: Dm3SdkConfig = {
                mainnetProvider: {} as ethers.providers.JsonRpcProvider,
                storageApi: {
                    addConversation: async () => {},
                    addMessage: async () => {},
                } as unknown as StorageAPI,
                nonce: '1',
                defaultDeliveryService: 'test.io',
                addressEnsSubdomain: '.addr.test',
                userEnsSubdomain: '.user.test',
                resolverBackendUrl: 'resolver.io',
                backendUrl: 'http://localhost:4060',
                _tld: mockTldResolver,
            };

            const dm3 = await new Dm3Sdk(mockConfig).login({
                profileKeys: alice.profileKeys,
                profile: alice.signedUserProfile,
                accountAddress: alice.address,
            });

            expect(
                (await dm3.conversations.addConversation('bob.eth'))?.messages
                    .list.length,
            ).toBe(0);

            const c = await dm3.conversations.addConversation('bob.eth');

            await c?.messages.sendMessage('Hi');
            expect(c?.messages.list.length).toBe(1);
            expect(c?.messages.list[0].envelop.message.message).toBe('Hi');
        });
    });
});
