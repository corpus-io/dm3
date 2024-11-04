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

        const sdk = new Dm3Sdk(mockConfig);

        const dm3 = await sdk.universalProfileLogin();
    });
});
