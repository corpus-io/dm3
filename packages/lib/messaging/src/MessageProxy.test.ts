/* eslint-disable max-len */
import { stringify } from '@dm3-org/dm3-lib-shared';
import { ProxySendParams, sendOverMessageProxy } from './MessageProxy';

const encryptedPayloadMock = {
    ciphertext:
        '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',
    ephemPublicKey: 'pMRc2/R2XHSYN4iYJCrIFnJdwXr87WWUK2uJOvJNoEw=',
    nonce: '0xeeb67dc5d1b4c3a933157e01',
};

const proxyEnvelop = {
    encryptedMessage: stringify(encryptedPayloadMock),
    encryptionEnvelops: [
        {
            deliveryServiceEnsName: 'ds1.dm3.eth',
            encryptionEnvelop: {
                metadata: {
                    deliveryInformation: stringify(encryptedPayloadMock),
                    messageHash:
                        '0xdac53d80a308eb9a48caca48719aada24a32f1cede2f4368817aa63b1375a09f',
                    encryptionScheme: 'x25519-chacha20-poly1305',
                    signature:
                        'U83xNns0JwWj3yw+dTle3bNHO4bJyB/DIA9PU2onfHCjzx5e0m3VPOpY9NiJRK7eX2cnHn9YQZ/h1Ji7UvonBg==',
                    version: 'v1',
                },
            },
        },
        {
            deliveryServiceEnsName: 'ds2.dm3.eth',
            encryptionEnvelop: {
                metadata: {
                    deliveryInformation: stringify(encryptedPayloadMock),
                    messageHash:
                        '0xdac53d80a308eb9a48caca48719aada24a32f1cede2f4368817aa63b1375a09f',
                    encryptionScheme: 'x25519-chacha20-poly1305',
                    signature:
                        'U83xNns0JwWj3yw+dTle3bNHO4bJyB/DIA9PU2onfHCjzx5e0m3VPOpY9NiJRK7eX2cnHn9YQZ/h1Ji7UvonBg==',
                    version: 'v1',
                },
            },
        },
    ],
    to: 'alice.eth',
};

describe.skip('MessageProxy', () => {
    describe('messageProxy', () => {
        it('use proxy', async () => {
            expect.assertions(1);
            const dsProfile = {
                publicSigningKey:
                    '0ekgI3CBw2iXNXudRdBQHiOaMpG9bvq9Jse26dButug=',
                publicEncryptionKey:
                    'Vrd/eTAk/jZb/w5L408yDjOO5upNFDGdt0lyWRjfBEk=',
                url: 'http://localhost',
            };

            const bobProfile = {
                profile: {
                    deliveryServices: ['ds1.dm3.eth', 'ds2.dm3.eth'],
                    publicEncryptionKey:
                        'Vrd/eTAk/jZb/w5L408yDjOO5upNFDGdt0lyWRjfBEk=',
                    publicSigningKey:
                        '0ekgI3CBw2iXNXudRdBQHiOaMpG9bvq9Jse26dButug=',
                },
                signature:
                    '0x58c8a32e989e82bd42e92d5b77bc5c31250f9bbb87fe029913735682f8a975510c6fd64210d30f28505cdd746163c47e810adbf100579c91a54796771216d0e91c',
            };

            const proxySendParams: ProxySendParams = {
                provider: {
                    resolveName: (_: string) =>
                        '0x699e492c15304bE7b9901c6d3f166bFb49c91999',
                    getResolver: (_: string) => {
                        return Promise.resolve({
                            getText: () =>
                                'data:application/json,' +
                                stringify(
                                    _ === 'alice.eth' ? bobProfile : dsProfile,
                                ),
                        });
                    },
                } as any,
                proxyEnvelop,
                getRessource: async () => dsProfile,
                submitMessage: async (url: string) => {
                    expect(url).toStrictEqual('http://localhost');
                },
            };

            await sendOverMessageProxy(proxySendParams);
        });
    });
});
