import { ethers } from 'ethers';
import { createProfileKeys } from '@dm3-org/dm3-lib-profile';
import {
    createStorageKey,
    EncryptAsymmetric,
    getStorageKeyCreationMessage,
} from '@dm3-org/dm3-lib-crypto';
import { buildEnvelop } from './Envelop';
import { Message, SendDependencies } from './Message';

const USER_ADDRESS_1 = '0x25A643B6e52864d0eD816F1E43c0CF49C83B8292';

const getMockProfileKeys = async () => {
    const nonce = '0';
    const wallet = new ethers.Wallet(
        '0xac58f2f021d6f148fd621b355edbd0ebadcf9682019015ef1219cf9c0c2ddc8b',
    );

    const nonceMsg = getStorageKeyCreationMessage(nonce, wallet.address);
    const signedMessage = await wallet.signMessage(nonceMsg);

    return await createProfileKeys(
        await createStorageKey(signedMessage),
        nonce,
    );
};
describe('Envelope', () => {
    describe('buildEnvelop', () => {
        it('throws an expection if a contract has no profile', async () => {
            const message: Message = {
                metadata: {
                    to: '',
                    from: USER_ADDRESS_1,
                    timestamp: 123,
                    type: 'NEW',
                },
                message: '',
                signature: '',
            };
            const encrpy: EncryptAsymmetric = (
                publicKey: string,
                payload: string,
            ) => {
                return Promise.resolve({
                    nonce: '',
                    ciphertext: payload,
                    ephemPublicKey: '',
                });
            };

            const sendDependencies: SendDependencies = {
                deliverServiceProfile: {
                    publicEncryptionKey: '',
                    publicSigningKey: '',
                    url: '',
                },
                keys: await getMockProfileKeys(),
                from: {
                    ensName: '',
                    profile: {
                        deliveryServices: [],
                        publicEncryptionKey: '',
                        publicSigningKey: '',
                    },
                },
                to: {
                    ensName: '',
                },
            };
            expect(async () => {
                await buildEnvelop(message, encrpy, sendDependencies);
            }).rejects.toEqual(Error('Contact has no profile'));
        });
        it('returns an encrypted envelop', async () => {
            const message: Message = {
                metadata: {
                    to: '',
                    from: USER_ADDRESS_1,
                    timestamp: 123,
                    type: 'NEW',
                },
                message: '',
                signature: '',
            };
            const encrpy: EncryptAsymmetric = (
                publicKey: string,
                payload: string,
            ) => {
                return Promise.resolve({
                    nonce: '',
                    ciphertext: payload,
                    ephemPublicKey: '',
                });
            };

            const sendDependencies: SendDependencies = {
                deliverServiceProfile: {
                    publicEncryptionKey: '',
                    publicSigningKey: '',
                    url: '',
                },
                keys: await getMockProfileKeys(),
                from: {
                    ensName: '',
                    profile: {
                        deliveryServices: [],
                        publicEncryptionKey: '',
                        publicSigningKey: '',
                    },
                },
                to: {
                    ensName: '',
                    profile: {
                        deliveryServices: [],
                        publicEncryptionKey: '',
                        publicSigningKey: '',
                    },
                },
            };

            const actualEnvelop = await buildEnvelop(
                message,
                encrpy,
                sendDependencies,
            );

            expect(actualEnvelop.envelop).toStrictEqual({
                message: {
                    metadata: {
                        from: '0x25A643B6e52864d0eD816F1E43c0CF49C83B8292',
                        timestamp: 123,
                        to: '',
                        type: 'NEW',
                    },
                    message: '',
                    signature: '',
                },
                metadata: {
                    encryptionScheme: 'x25519-chacha20-poly1305',
                    deliveryInformation: {
                        from: '',
                        to: '',
                    },
                    messageHash:
                        '0xf2f8e4e1301481b3d7f11127adc11f5f4cf5faa8261296501d7726206ba35a85',
                    version: 'v1',
                    signature:
                        'sHQCkcuocwB7E9iy2hzyvl45020vFNgDfEV/dAKaMal98svGl7Gk8h0vcXxmhNwZt+rJ0j+Bc6sgpoeiIBjBCQ==',
                },
            });
        });
    });
});
