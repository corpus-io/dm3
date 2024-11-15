import axios from 'axios';
import { SignedUserProfile, formatAddress } from '@dm3-org/dm3-lib-profile';
import { sign } from '@dm3-org/dm3-lib-crypto';

/**
 * claims a dm3.eth subdomain
 * @param dm3Name the ENS alias
 * @param offchainResolverUrl The offchain resolver endpoint url
 * @param addressNAme The orignial ENS name
 * @param privateKey The owner private key
 */
export async function claimSubdomain(
    dm3Name: string,
    offchainResolverUrl: string,
    addressName: string,
    privateKey: string,
): Promise<boolean> {
    const url = `${offchainResolverUrl}/profile/name`;
    const data = {
        dm3Name,
        addressName,
        signature: await sign(privateKey, 'alias: ' + dm3Name),
    };

    const { status } = await axios.post(url, data);
    return status === 200;
}

/**
 * removes a dm3.eth subdomain
 * @param alias the ENS alias
 * @param offchainResolverUrl The offchain resolver endpoint url
 * @param privateKey The owner private key
 */
export async function removeAlias(
    dm3Name: string,
    offchainResolverUrl: string,
    privateKey: string,
): Promise<boolean> {
    const url = `${offchainResolverUrl}/profile/deleteName`;
    const data = {
        dm3Name,
        signature: await sign(privateKey, 'remove: ' + dm3Name),
    };

    const { status } = await axios.post(url, data);
    return status === 200;
}

/**
 * claims an address based ENS subdomain name
 * @param address The ethereum address
 * @param offchainResolverUrl The offchain resolver endpoint url
 * @param subdomain The addr subdomain of the client .iE addr.dm3.eth
 * @param signedUserProfile The signed dm3 user profile
 */
export async function claimAddress(
    address: string,
    offchainResolverUrl: string,
    addrSubdomainDomain: string,
    signedUserProfile: SignedUserProfile,
) {
    try {
        const url = `${offchainResolverUrl}/profile/address`;
        const data = {
            signedUserProfile,
            address,
            subdomain: addrSubdomainDomain,
        };

        const { status } = await axios.post(url, data);
        return status === 200;
    } catch (err) {
        console.log('subdomain already claimed');
        return false;
    }
}

/**
 * updates profile with new delivery service nodes added
 * @param address The ethereum address
 * @param offchainResolverUrl The offchain resolver endpoint url
 * @param subdomain The addr subdomain of the client .iE addr.dm3.eth
 * @param signedUserProfile The signed dm3 user profile
 */
export async function updateProfile(
    address: string,
    offchainResolverUrl: string,
    addrSubdomainDomain: string,
    signedUserProfile: SignedUserProfile,
) {
    try {
        const url = `${offchainResolverUrl}/profile/address`;
        const data = {
            signedUserProfile,
            address,
            subdomain: addrSubdomainDomain,
        };

        const { status } = await axios.post(url, data);
        return status === 200;
    } catch (err) {
        console.log('update profile failed');
        return false;
    }
}

/**
 * returns the linked ENS name for an eth address
 * @param address The ethereum address
 * @param offchainResolverUrl The offchain resolver endpoint url
 */
export async function getNameForAddress(
    address: string,
    offchainResolverUrl: string,
): Promise<string | undefined> {
    const url = `${offchainResolverUrl}/profile/name/${formatAddress(address)}`;
    try {
        const { data } = await axios.get(url);
        return data.name;
    } catch (e) {
        console.log('Error in getName for address : ', e);
        return;
    }
}
export type GetNameForAddress = typeof getNameForAddress;
