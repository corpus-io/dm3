import { decryptAsymmetric } from '@dm3-org/dm3-lib-crypto';
import { ethers } from 'ethers';
import { isSpam } from '.';
import { testData } from '../../../../../test-data/encrypted-envelops.test';

import { SpamFilterRules } from './SpamFilterRules';
import { Account } from '@dm3-org/dm3-lib-delivery';

const keysA = {
    encryptionKeyPair: {
        publicKey: 'eHmMq29FeiPKfNPkSctPuZGXvV0sKeO/KZkX2nXvMgw=',
        privateKey: 'pMI77F2w3GK+omZCB4A61WDqISOOnWGXR2f/MTLbqbY=',
    },
    signingKeyPair: {
        publicKey: '+tkDQWZfv9ixBmObsf8tgTHTZajwAE9muTtFAUj2e9I=',
        privateKey:
            '+DpeBjCzICFoi743/466yJunsHR55Bhr3GnqcS4cuJX62QNBZl+/2LEGY5ux/y2BMdNlqPAAT2a5O0UBSPZ70g==',
    },
    storageEncryptionKey: '+DpeBjCzICFoi743/466yJunsHR55Bhr3GnqcS4cuJU=',
    storageEncryptionNonce: 0,
};

const connection = {
    provider: {
        getTransactionCount: async (from: string) => {
            switch (from) {
                case '0x25A643B6e52864d0eD816F1E43c0CF49C83B8292':
                    return 1;
                case '0xDd36ae7F9a8E34FACf1e110c6e9d37D0dc917855':
                    return 0;
                default:
                    return 0;
            }
        },
        getBalance: async (from: string) => {
            switch (from) {
                case '0x25A643B6e52864d0eD816F1E43c0CF49C83B8292':
                    return ethers.BigNumber.from('0');
                case '0xDd36ae7F9a8E34FACf1e110c6e9d37D0dc917855':
                    return ethers.BigNumber.from('1');
                default:
                    return ethers.BigNumber.from('0');
            }
        },
    },
} as any;

describe('SpamFilter', () => {
    describe('isSpam ', () => {
        it('Should filter correctly with one filter criteria', async () => {
            const account = {
                spamFilterRules: { minBalance: '1' },
            } as Account & { spamFilterRules: SpamFilterRules };

            const envelopAIsSpam = await isSpam(
                connection.provider,
                account,
                JSON.parse(
                    await decryptAsymmetric(
                        keysA.encryptionKeyPair,
                        JSON.parse(
                            testData.envelopA.metadata.deliveryInformation,
                        ),
                    ),
                ),
            );
            const envelopBIsSpam = await isSpam(
                connection.provider,
                account,
                JSON.parse(
                    await decryptAsymmetric(
                        keysA.encryptionKeyPair,
                        JSON.parse(
                            testData.envelopB.metadata.deliveryInformation,
                        ),
                    ),
                ),
            );

            await expect(envelopAIsSpam).toBe(true);
            await expect(envelopBIsSpam).toBe(false);
        });
        it('Should use filter correctly with two filter criteria', async () => {
            const account = {
                spamFilterRules: { minBalance: '1', minNonce: 2 },
            } as Account & { spamFilterRules: SpamFilterRules };

            const envelopAIsSpam = await isSpam(
                connection.provider,
                account,
                JSON.parse(
                    await decryptAsymmetric(
                        keysA.encryptionKeyPair,
                        JSON.parse(
                            testData.envelopA.metadata.deliveryInformation,
                        ),
                    ),
                ),
            );
            const envelopBIsSpam = await isSpam(
                connection.provider,
                account,
                JSON.parse(
                    await decryptAsymmetric(
                        keysA.encryptionKeyPair,
                        JSON.parse(
                            testData.envelopB.metadata.deliveryInformation,
                        ),
                    ),
                ),
            );

            await expect(envelopAIsSpam).toBe(true);
            await expect(envelopBIsSpam).toBe(true);
        });
        it('Should not consider a message as spam if no SpamFilterRules are provided', async () => {
            const account = {} as Account & {
                spamFilterRules: SpamFilterRules;
            };

            const envelopAIsSpam = await isSpam(
                connection.provider,
                account,
                JSON.parse(
                    await decryptAsymmetric(
                        keysA.encryptionKeyPair,
                        JSON.parse(
                            testData.envelopA.metadata.deliveryInformation,
                        ),
                    ),
                ),
            );

            await expect(envelopAIsSpam).toBe(false);
        });
    });
});
