/* eslint-disable max-len */
import { createProxyEnvelop } from './ProxyEnvelop';
import { createMessage, SendDependencies } from './Message';
import { stringify } from '@dm3-org/dm3-lib-shared';

const bob = {
    keys: {
        encryptionKeyPair: {
            privateKey: '+JqZSvl7gco9Di5+Ovke2yi7rOpeMaL3/05i+cFjbuo=',
            publicKey: 'KiJ3rfbOMjiHqgB25JsR2Eq5Y+bdg5SoUAGxo4XcQ0M=',
        },
        signingKeyPair: {
            privateKey:
                'djKxzRYfNoE+gvpFhWlEtejKSpt1UammdibtZ5aG8c4NYR8686/lfB748HARg5ULSGTV1i9WBsOIT5ApQFJNfg==',
            publicKey: 'DWEfOvOv5Xwe+PBwEYOVC0hk1dYvVgbDiE+QKUBSTX4=',
        },
        storageEncryptionKey: 'djKxzRYfNoE+gvpFhWlEtejKSpt1UammdibtZ5aG8c4=',
        storageEncryptionNonce: '0',
    },
    account: {
        ensName: 'bob.eth',
        profile: {
            deliveryServices: ['ds1.dm3.eth', 'ds2.dm3.eth'],
            publicEncryptionKey: 'Vrd/eTAk/jZb/w5L408yDjOO5upNFDGdt0lyWRjfBEk=',
            publicSigningKey: '0ekgI3CBw2iXNXudRdBQHiOaMpG9bvq9Jse26dButug=',
        },
        profileSignature:
            '0x1fb30506602982bddec4b2bae78bf1a9b82f740d4a64627bc5e31de295336cff2cb9d4be06a643ffce8d779aa5270a01ea687f3917115ef5ce21b34b858f14c61c',
    },
    address: '0x71CB05EE1b1F506fF321Da3dac38f25c0c9ce6E1',
    signedUserProfile: {
        profile: {
            deliveryServices: ['ds1.dm3.eth', 'ds2.dm3.eth'],
            publicEncryptionKey: 'Vrd/eTAk/jZb/w5L408yDjOO5upNFDGdt0lyWRjfBEk=',
            publicSigningKey: '0ekgI3CBw2iXNXudRdBQHiOaMpG9bvq9Jse26dButug=',
        },
        signature:
            '0x1fb30506602982bddec4b2bae78bf1a9b82f740d4a64627bc5e31de295336cff2cb9d4be06a643ffce8d779aa5270a01ea687f3917115ef5ce21b34b858f14c61c',
    },
};

const alice = {
    account: {
        ensName: 'alice.eth',
        profile: {
            deliveryServices: ['ds1.dm3.eth', 'ds2.dm3.eth'],
            publicEncryptionKey: 'Vrd/eTAk/jZb/w5L408yDjOO5upNFDGdt0lyWRjfBEk=',
            publicSigningKey: '0ekgI3CBw2iXNXudRdBQHiOaMpG9bvq9Jse26dButug=',
        },
        profileSignature:
            '0x74d5b1e3371fb1ca6fb766de8410e9cd0b8f8e2bf01c9cb4dfd8b25ee3820afd0311359d3341002b1637c1c89ea20cb6f53613b89bacb5607f995ac754d865c01b',
    },
    address: '0xa8cDEAD39151D4EBE825E12b2E6aC75287b9873d',
    signedUserProfile: {
        profile: {
            deliveryServices: ['ds1.dm3.eth', 'ds2.dm3.eth'],
            publicEncryptionKey: 'Vrd/eTAk/jZb/w5L408yDjOO5upNFDGdt0lyWRjfBEk=',
            publicSigningKey: '0ekgI3CBw2iXNXudRdBQHiOaMpG9bvq9Jse26dButug=',
        },
        signature:
            '0x74d5b1e3371fb1ca6fb766de8410e9cd0b8f8e2bf01c9cb4dfd8b25ee3820afd0311359d3341002b1637c1c89ea20cb6f53613b89bacb5607f995ac754d865c01b',
    },
};

describe('ProxyEnvelope', () => {
    describe('createProxyEnvelp', () => {
        it('returns an encrypted envelop', async () => {
            const sendDependencies: SendDependencies = {
                deliverServiceProfile: {
                    publicEncryptionKey:
                        'KiJ3rfbOMjiHqgB25JsR2Eq5Y+bdg5SoUAGxo4XcQ0M=',
                    publicSigningKey:
                        'DWEfOvOv5Xwe+PBwEYOVC0hk1dYvVgbDiE+QKUBSTX4=',
                    url: '',
                },

                from: bob.account,
                to: alice.account,
                keys: bob.keys,
            };

            const encryptedPayloadMock = {
                ciphertext:
                    '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',
                ephemPublicKey: 'pMRc2/R2XHSYN4iYJCrIFnJdwXr87WWUK2uJOvJNoEw=',
                nonce: '0xeeb67dc5d1b4c3a933157e01',
            };

            let proxyEnvelop: any = await createProxyEnvelop(
                await createMessage(
                    'alice.eth',
                    'bob.eth',
                    'test',
                    bob.keys.signingKeyPair.privateKey,
                ),
                {
                    getResolver: (_: string) =>
                        Promise.resolve({
                            getText: () =>
                                'data:application/json,' +
                                stringify({
                                    publicSigningKey:
                                        '0ekgI3CBw2iXNXudRdBQHiOaMpG9bvq9Jse26dButug=',
                                    publicEncryptionKey:
                                        'Vrd/eTAk/jZb/w5L408yDjOO5upNFDGdt0lyWRjfBEk=',
                                    url: 'http://localhost',
                                }),
                        }),
                } as any,
                bob.keys,
                (async () => {}) as any,
                sendDependencies,
            );

            delete proxyEnvelop.encryptedMessage;
            delete proxyEnvelop.encryptionEnvelops[0].encryptionEnvelop.metadata
                .deliveryInformation;
            delete proxyEnvelop.encryptionEnvelops[0].encryptionEnvelop.metadata
                .signature;
            delete proxyEnvelop.encryptionEnvelops[0].encryptionEnvelop.metadata
                .messageHash;
            delete proxyEnvelop.encryptionEnvelops[1].encryptionEnvelop.metadata
                .deliveryInformation;
            delete proxyEnvelop.encryptionEnvelops[1].encryptionEnvelop.metadata
                .signature;
            delete proxyEnvelop.encryptionEnvelops[1].encryptionEnvelop.metadata
                .messageHash;

            expect(proxyEnvelop).toStrictEqual({
                encryptionEnvelops: [
                    {
                        deliveryServiceEnsName: 'ds1.dm3.eth',
                        encryptionEnvelop: {
                            metadata: {
                                encryptionScheme: 'x25519-chacha20-poly1305',

                                version: 'v1',
                            },
                        },
                    },
                    {
                        deliveryServiceEnsName: 'ds2.dm3.eth',
                        encryptionEnvelop: {
                            metadata: {
                                encryptionScheme: 'x25519-chacha20-poly1305',

                                version: 'v1',
                            },
                        },
                    },
                ],
                to: 'alice.eth',
            });
        });
    });
});
