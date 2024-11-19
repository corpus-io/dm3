import { StorageAPI } from '@dm3-org/dm3-lib-storage';
import {
    MockedUserProfile,
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
        const c = dm3.conversations.list;
        expect(c.length).toBe(1);
        expect(c[0].contact.name).toBe('bob.eth');
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
        const c = dm3.conversations.list;
        console.log(c);
        expect(c.length).toBe(2);
        expect(c[0].contact.name).toBe('bob.eth');
        expect(c[1].contact.name).toBe('karl.eth');
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
        const c = dm3.conversations.list;
        expect(c.length).toBe(1);
        expect(c[0].contact.name).toBe('bob.eth');
    });
});
