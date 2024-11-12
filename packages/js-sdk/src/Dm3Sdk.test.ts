import { ethers } from 'ethers';
import { Dm3Sdk, Dm3SdkConfig } from './Dm3Sdk';

describe('Dm3Sdk', () => {
    let upController: ethers.Signer;

    beforeEach(async () => {
        upController = ethers.Wallet.createRandom();
    });

    it('test', async () => {
        const luksoProvider = () => ({
            send: () => Promise.resolve([]),
            getSigner: () => Promise.resolve(upController),
        });
        const mockConfig: Dm3SdkConfig = {
            mainnetProvider: {} as ethers.providers.JsonRpcProvider,
            lukso: luksoProvider as any,
            nonce: '1',
            defaultDeliveryService: 'test.io',
            addressEnsSubdomain: 'addr.test',
            userEnsSubdomain: 'user.test',
            resolverBackendUrl: 'resolver.io',
            backendUrl: 'backend.io',
        };

        const dm3 = await new Dm3Sdk().universalProfileLogin();
        await dm3.conversations.addConversation('karl.eth');
        const c = dm3.conversations.list;
        const karl = c[0];
    });
});
