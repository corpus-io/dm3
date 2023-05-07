import {
    KeyPair,
    createStorageKey,
    getStorageKeyCreationMessage,
    getRandomNonce,
} from 'dm3-lib-crypto';
import { sha256, stringify } from 'dm3-lib-shared';
import { ethers } from 'ethers';
import queryString from 'query-string';
import { Dm3Profile } from './profileResolver/ProfileResolver';
import { createProfileKeys } from './profileKeys/createProfileKeys';
import { SignedUserProfile, UserProfile } from './types';

export function formatAddress(address: string) {
    return ethers.utils.getAddress(address);
}

export interface ProfileKeys {
    encryptionKeyPair: KeyPair;
    signingKeyPair: KeyPair;
    storageEncryptionKey: string;
    storageEncryptionNonce: string;
}

export interface PrivateKeys {
    privateMessagingKey: string;
    privateSigningKey: string;
}

export interface Account {
    ensName: string;
    profile?: UserProfile;
    profileSignature?: string;
}

export interface CreateProfileOptions {
    nonce: string;
    storageKey?: string;
    signer: (msg: string, address: string) => Promise<string>;
}

export const PROFILE_RECORD_NAME = 'network.dm3.profile';

/**
 * signs a profile with an ethereum account key
 * @param stringifiedProfile stringified dm3 user profile object
 */
export function getProfileCreationMessage(stringifiedProfile: string) {
    return (
        `Please sign this message to link your dm3 profile with your Wallet.` +
        `(This signature will not trigger any transaction or cost gas fees.)` +
        `Your dm3 profile:\n\n ${stringifiedProfile}`
    );
}

/**
 * normalizes an ENS name
 * @param ensName name that should be normalized
 */
export function normalizeEnsName(ensName: string): string {
    return ethers.utils.nameprep(ensName);
}

/**
 * make too long names shorter
 * @param ensName The ENS name
 * @param size Chars to show without cut
 * @param forFile Use shortend name for a file name
 */
export function getAccountDisplayName(
    ensName: string,
    size: number,
    forFile?: boolean,
): string {
    const normalizedEnsName = normalizeEnsName(ensName);

    const charsToShow = Math.floor(size * 0.4);

    return normalizedEnsName.length > size
        ? normalizedEnsName.substring(0, charsToShow) +
              (forFile ? '-' : '...') +
              normalizedEnsName.substring(
                  normalizedEnsName.length - charsToShow,
              )
        : normalizedEnsName;
}

/**
 * check the signature of the fetched profile
 * @param provider Eth rpc provider
 * @param signedUserProfile The profile to check
 * @param ensName The ENS domain name
 */
export async function checkUserProfile(
    provider: ethers.providers.JsonRpcProvider,
    { profile, signature }: SignedUserProfile,
    ensName: string,
): Promise<boolean> {
    const accountAddress = await provider.resolveName(ensName);

    if (!accountAddress) {
        throw Error(`Couldn't resolve name`);
    }

    return checkUserProfileWithAddress({ profile, signature }, accountAddress);
}

/**
 * check the signature of the fetched user profile using the eth address
 * @param signedUserProfile The profile to check
 * @param accountAddress The ENS domain name
 */
export function checkUserProfileWithAddress(
    { profile, signature }: SignedUserProfile,
    accountAddress: string,
): boolean {
    const createUserProfileMessage = getProfileCreationMessage(
        stringify(profile),
    );

    return (
        ethers.utils.recoverAddress(
            ethers.utils.hashMessage(createUserProfileMessage),
            signature,
        ) === formatAddress(accountAddress)
    );
}

/**
 * check a signature by recovering the signer address
 * @param stringToCheck Signed string
 * @param signature The signature
 * @param signature The Ethereum account address of the signer
 */
export function checkStringSignature(
    stringToCheck: string,
    signature: string,
    accountAddress: string,
): boolean {
    return (
        ethers.utils.recoverAddress(
            ethers.utils.hashMessage(stringToCheck),
            signature,
        ) === formatAddress(accountAddress)
    );
}

/**
 * create the string used to create the browser storage key
 * @param ensName The ENS name
 */
export function getBrowserStorageKey(ensName: string) {
    return 'userStorageSnapshot:' + normalizeEnsName(ensName);
}

export type GetResource<T> = (uri: string) => Promise<T | undefined>;

/**
 * checks the user profile hash contained in the `dm3Hash` URI prarameter
 * @param profile dm3 user profile
 * @param uri URI containing the `dm3Hash` prarameter
 */
export function checkProfileHash(profile: Dm3Profile, uri: string): boolean {
    const parsedUri = queryString.parseUrl(uri);
    return sha256(stringify(profile)) === parsedUri.query.dm3Hash;
}
export function checkAccount(account: Account | undefined): Required<Account> {
    if (!account) {
        throw Error('No account');
    }
    if (!account.profile) {
        throw Error('Account has no profile.');
    }
    return account as Required<Account>;
}
/**
 * checks if two ENS names are the same
 * @param ensNameA first ENS name
 * @param ensNameB second ENS name
 */
export function isSameEnsName(
    ensNameA: string,
    ensNameB: string,
    ensNameBAlias?: string,
): boolean {
    return (
        normalizeEnsName(ensNameA) === normalizeEnsName(ensNameB) ||
        (!!ensNameBAlias &&
            normalizeEnsName(ensNameA) === normalizeEnsName(ensNameBAlias))
    );
}

async function createKeyPairsFromSig(
    provider: ethers.providers.JsonRpcProvider,
    accountAddress: string,
    nonce: string,
    storageKey?: string,
): Promise<ProfileKeys> {
    if (!storageKey) {
        const storageKeyCreationMessage = getStorageKeyCreationMessage(nonce);
        const signature = await provider.send('personal_sign', [
            storageKeyCreationMessage,
            accountAddress,
        ]);
        const newStorageKey = await createStorageKey(signature);
        return await createProfileKeys(newStorageKey, nonce);
    } else {
        return await createProfileKeys(storageKey, nonce);
    }
}

/**
 * creates a dm3 profile
 * @param accountAddress wallet address used to sign the profile
 * @param deiveryServiceNames list of delviery service ENS names
 * @param provider ethers JsonRpcProvider
 * @param options Optional creation settings
 */
export async function createProfile(
    accountAddress: string,
    deiveryServiceNames: string[],
    provider: ethers.providers.JsonRpcProvider,
    options?: Partial<CreateProfileOptions>,
): Promise<{
    signedProfile: SignedUserProfile;
    keys: ProfileKeys;
    nonce: string;
}> {
    const { nonce, storageKey, signer }: CreateProfileOptions = {
        nonce: options?.nonce ?? (await getRandomNonce()),
        storageKey: options?.storageKey,
        signer:
            options?.signer ??
            ((msg: string, accountAddress: string) =>
                provider.send('personal_sign', [msg, accountAddress])),
    };

    const keys = await createKeyPairsFromSig(
        provider,
        accountAddress,
        nonce,
        storageKey,
    );

    const profile: UserProfile = {
        publicEncryptionKey: keys.encryptionKeyPair.publicKey,
        publicSigningKey: keys.signingKeyPair.publicKey,
        deliveryServices: deiveryServiceNames,
    };

    const profileCreationMessage = getProfileCreationMessage(
        stringify(profile),
    );
    const profileSig = await signer(profileCreationMessage, accountAddress);
    return {
        signedProfile: { profile, signature: profileSig },
        keys,
        nonce,
    };
}
