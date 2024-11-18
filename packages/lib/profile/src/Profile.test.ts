import { stringify } from '@dm3-org/dm3-lib-shared';
import { ethers } from 'ethers';
import { sha256 } from 'ethers/lib/utils';

import {
    Account,
    checkProfileHash,
    checkStringSignature,
    checkUserProfile,
    checkUserProfileWithAddress,
    createProfile,
    getAccountDisplayName,
    getBrowserStorageKey,
    getProfileCreationMessage,
    normalizeEnsName,
} from './Profile';
import { SignedUserProfile, UserProfile } from './types';

const getProfileData = async (): Promise<{
    address: string;
    signedUserProfile: SignedUserProfile;
    account: Account;
    wallet: ethers.Wallet;
}> => {
    const profile: UserProfile = {
        publicSigningKey: '0ekgI3CBw2iXNXudRdBQHiOaMpG9bvq9Jse26dButug=',
        publicEncryptionKey: 'Vrd/eTAk/jZb/w5L408yDjOO5upNFDGdt0lyWRjfBEk=',
        deliveryServices: [''],
    };

    const mnemonic =
        'announce room limb pattern dry unit scale effort smooth jazz weasel alcohol';

    const wallet = ethers.Wallet.fromMnemonic(mnemonic);

    const createUserProfileMessage = getProfileCreationMessage(
        stringify(profile),
        wallet.address,
    );
    const signature = await wallet.signMessage(createUserProfileMessage);

    return {
        wallet,
        address: wallet.address,
        account: {
            ensName: 'bob.eth',
            profile,
            profileSignature: signature,
        },
        signedUserProfile: {
            profile,
            signature,
        },
    };
};

describe('Account', () => {
    describe('getAccountDisplayName', () => {
        test('get correct account display name', async () => {
            expect(getAccountDisplayName('alice.eth', 10)).toStrictEqual(
                'alice.eth',
            );

            expect(getAccountDisplayName('Alice.eth', 10)).toStrictEqual(
                'alice.eth',
            );

            expect(getAccountDisplayName('0x25a6....eth', 10)).toStrictEqual(
                '0x25....eth',
            );
        });

        test('get correct account display name for file', async () => {
            expect(
                getAccountDisplayName(
                    '0x25A643B6e52864d0eD816F1E43c0CF49C83B8292.addr.dm3.eth',
                    10,
                    true,
                ),
            ).toStrictEqual('0x25-.eth');
        });

        test('get correct account display name for short account', async () => {
            expect(getAccountDisplayName('alice.eth', 10, true)).toStrictEqual(
                'alice.eth',
            );
        });
    });

    describe('normalizeEnsName', () => {
        test('should normalize an ENS name', async () => {
            expect(normalizeEnsName('Alice.eth')).toStrictEqual('alice.eth');
        });
    });

    describe('checkProfileHash', () => {
        test('should accept a correct hash', async () => {
            const profile: UserProfile = {
                publicSigningKey: '3',
                publicEncryptionKey: '2',
                deliveryServices: [''],
            };

            const wallet = ethers.Wallet.createRandom();
            const signature = await wallet.signMessage(stringify(profile));
            const signedProfile = {
                profile,
                signature,
            };

            const uri =
                'http://test/test?dm3Hash=' +
                sha256(ethers.utils.toUtf8Bytes(stringify(signedProfile)));

            expect(checkProfileHash(signedProfile, uri)).toStrictEqual(true);
        });

        test('should reject an invalid hash', async () => {
            const profile: UserProfile = {
                publicSigningKey: '3',
                publicEncryptionKey: '2',
                deliveryServices: [''],
            };
            const wallet = ethers.Wallet.createRandom();
            const signature = await wallet.signMessage(stringify(profile));
            const signedProfile = {
                profile,
                signature,
            };

            const uri = 'http://test/test?dm3Hash=123456';
            expect(checkProfileHash(signedProfile, uri)).toStrictEqual(false);
        });

        test('should reject an URI without hash', async () => {
            const profile: UserProfile = {
                publicSigningKey: '3',
                publicEncryptionKey: '2',
                deliveryServices: [''],
            };
            const wallet = ethers.Wallet.createRandom();
            const createUserProfileMessage = getProfileCreationMessage(
                stringify(profile),
                wallet.address,
            );
            const signature = await wallet.signMessage(
                createUserProfileMessage,
            );
            const signedProfile = {
                profile,
                signature,
            };

            const uri = 'http://test/test';
            expect(checkProfileHash(signedProfile, uri)).toStrictEqual(false);
        });
    });

    describe('checkUserProfile', () => {
        test('checkUserProfile should accept a correct signature ', async () => {
            const profile = await getProfileData();

            expect(
                await checkUserProfile(
                    {
                        resolveName: async () => profile.address,
                    } as any,
                    {
                        _isProvider: true,
                    } as any,

                    {
                        profile: profile.account.profile!,
                        signature: profile.signedUserProfile.signature,
                    },

                    'alice.eth',
                ),
            ).toStrictEqual(true);
        });

        test('checkUserProfile should reject an invalid signature ', async () => {
            const profile = await getProfileData();

            expect(
                await checkUserProfile(
                    {
                        resolveName: async () => profile.address,
                    } as any,
                    {
                        _isProvider: true,
                    } as any,
                    {
                        profile: {
                            ...profile.account.profile!,
                            deliveryServices: ['test.test'],
                        },
                        signature: profile.signedUserProfile.signature,
                    },
                    'alice.eth',
                ),
            ).toStrictEqual(false);
        });
    });

    describe('getBrowserStorageKey', () => {
        test('should return the correct storage key', async () => {
            expect(getBrowserStorageKey('alice.eth')).toStrictEqual(
                'userStorageSnapshot:alice.eth',
            );
        });
    });

    describe('checkStringSignature', () => {
        test('Should accept a valid signature of a string', async () => {
            const wallet = ethers.Wallet.createRandom();
            const sig = await wallet.signMessage('test');

            expect(
                checkStringSignature('test', sig, wallet.address),
            ).toStrictEqual(true);
        });

        test('Should reject an invalid signature of a string', async () => {
            const wallet = ethers.Wallet.createRandom();
            const sig = await wallet.signMessage('test');

            expect(
                checkStringSignature('test1', sig, wallet.address),
            ).toStrictEqual(false);
        });
    });

    describe('createProfile', () => {
        test('Should create a correct user profile (provider sign)', async () => {
            const profileData = await getProfileData();
            const profile = await createProfile(
                profileData.address,
                profileData.signedUserProfile.profile.deliveryServices,
                {
                    send: (name: string, params: string[]) => {
                        return profileData.wallet.signMessage(params[0]);
                    },
                } as any,
            );
            expect(
                checkUserProfileWithAddress(
                    profile.signedProfile,
                    profileData.address,
                ),
            ).toStrictEqual(true);
        });

        test('Should create a correct user profile', async () => {
            const profileData = await getProfileData();
            const profile = await createProfile(
                profileData.address,
                profileData.signedUserProfile.profile.deliveryServices,
                {} as any,
                {
                    signer: (msg, address) =>
                        profileData.wallet.signMessage(msg),
                },
            );
            expect(
                checkUserProfileWithAddress(
                    profile.signedProfile,
                    profileData.address,
                ),
            ).toStrictEqual(true);
        });
    });

    describe('checkUserProfile', () => {
        test('Should accept a valid profile signature', async () => {
            const profile = await getProfileData();
            expect(
                await checkUserProfile(
                    {
                        resolveName: async () => profile.address,
                    } as any,
                    {
                        _isProvider: true,
                    } as any,
                    profile.signedUserProfile,
                    profile.account.ensName,
                ),
            ).toStrictEqual(true);
        });

        test('Should reject an invalid profile signature', async () => {
            const profile = await getProfileData();
            expect(
                await checkUserProfile(
                    {
                        resolveName: async () => profile.address,
                    } as any,
                    {
                        _isProvider: true,
                    } as any,
                    {
                        profile: {
                            ...profile.account.profile!,
                            deliveryServices: ['http://1'],
                        },
                        signature: (
                            await getProfileData()
                        ).signedUserProfile.signature,
                    },

                    (
                        await getProfileData()
                    ).account.ensName,
                ),
            ).toStrictEqual(false);
        });
    });
});
