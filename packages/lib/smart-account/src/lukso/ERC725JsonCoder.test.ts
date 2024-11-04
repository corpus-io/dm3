import { ethers } from 'ethers';
import { ERC725JsonCoder } from './ERC725JsonCoder';
import LSP6Schema from '@erc725/erc725.js/schemas/LSP6KeyManager.json';
import ERC725 from '@erc725/erc725.js';
import { Data } from '@erc725/erc725.js/build/main/src/types/decodeData';

describe('luksoSchema', () => {
    it('encodes Dm3KeyStore with one address', () => {
        const signedUserProfile = {
            profile: {
                publicSigningKey: '0x123',
                publicEncryptionKey: '0x456',
                deliveryServices: ['0x789'],
            },
            signature: '0x101',
        };

        const wallet = ethers.Wallet.createRandom();
        const encoded = new ERC725JsonCoder().encodeDm3Profile(
            wallet.address,
            signedUserProfile,
        );

        console.log('enc', encoded);
    });
});
