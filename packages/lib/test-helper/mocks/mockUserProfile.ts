import {
    createStorageKey,
    getStorageKeyCreationMessage,
} from '@dm3-org/dm3-lib-crypto';
import {
    Account,
    DEFAULT_NONCE,
    ProfileKeys,
    SignedUserProfile,
    UserProfile,
    createProfileKeys,
    getProfileCreationMessage,
} from '@dm3-org/dm3-lib-profile';
import { stringify } from '@dm3-org/dm3-lib-shared';
import { ethers } from 'ethers';
import { getAddress } from 'ethers/lib/utils';

export type MockedUserProfile = {
    address: string;
    privateKey: string;
    signedUserProfile: SignedUserProfile;
    profileKeys: ProfileKeys;
    account: Account;
    wallet: ethers.Wallet;
    stringified: string;
};

export const mockUserProfile = async (
    wallet: ethers.Wallet,
    ensName: string,
    deliveryServices: string[],
    nonce: string = DEFAULT_NONCE,
): Promise<MockedUserProfile> => {
    const storageKeyCreationMessage = getStorageKeyCreationMessage(
        DEFAULT_NONCE,
        wallet.address,
    );

    const storageKeySig = await wallet.signMessage(storageKeyCreationMessage);

    const storageKey = await createStorageKey(storageKeySig);
    const profileKeys = await createProfileKeys(storageKey, DEFAULT_NONCE);

    const profile: UserProfile = {
        publicSigningKey: profileKeys.signingKeyPair.publicKey,
        publicEncryptionKey: profileKeys.encryptionKeyPair.publicKey,
        deliveryServices,
    };
    const createUserProfileMessage = getProfileCreationMessage(
        stringify(profile),
        wallet.address,
    );
    const userProfileSig = await wallet.signMessage(createUserProfileMessage);

    return {
        wallet,
        address: getAddress(wallet.address),
        privateKey: wallet.privateKey,
        account: {
            ensName,
            profile,
            profileSignature: userProfileSig,
        },
        signedUserProfile: {
            profile,
            signature: userProfileSig,
        },
        profileKeys,
        stringified:
            'data:application/json,' +
            JSON.stringify({
                profile,
                signature: userProfileSig,
            }),
    };
};
