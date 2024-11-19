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

describe('Dm3Sdk', () => {
    let alice: MockedUserProfile;

    //Axios mock to mock the http requests
    let axiosMock;

    beforeEach(async () => {
        alice = await mockUserProfile(
            ethers.Wallet.createRandom(),
            'alice.up',
            ['test.io'],
        );
    });

    it('test', async () => {
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

        axiosMock
            .onGet(
                `http://localhost:4060/auth/${normalizeEnsName(
                    alice.address,
                )}.addr.test`,
            )
            .reply(200, 'mock-challenge');

        axiosMock
            .onPost(
                `http://localhost:4060/auth/${normalizeEnsName(
                    alice.address,
                )}.addr.test`,
            )
            .reply(200, 'mock-challenge');

        const mockConfig: Dm3SdkConfig = {
            mainnetProvider: {} as ethers.providers.JsonRpcProvider,
            storageApi: {} as StorageAPI,
            nonce: '1',
            defaultDeliveryService: 'test.io',
            addressEnsSubdomain: '.addr.test',
            userEnsSubdomain: '.user.test',
            resolverBackendUrl: 'resolver.io',
            backendUrl: 'http://localhost:4060',
        };

        const dm3 = await new Dm3Sdk(mockConfig).login({
            profileKeys: alice.profileKeys,
            profile: alice.signedUserProfile,
            accountAddress: alice.address,
        });

        console.log(dm3.conversations.conversations);

        /*      await dm3.conversations.addConversation('karl.eth');
        const c = dm3.conversations.conversations;
        const karl = c[0]; */
    });
});
