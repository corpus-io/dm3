import { log } from 'dm3-lib-shared';
import axios from 'axios';
import {
    ProfileResolver,
    LinkResolver,
    validateSignedUserProfile,
    IpfsResolver,
    JsonResolver,
} from '../profileResolver';
import { ethers } from 'ethers';
import { SignedUserProfile } from '../types';
import { checkUserProfile } from '../Profile';
/**
 * fetch a dm3 user profile
 * @param connection dm3 connection object
 * @param contact The Ethereum account address of the of the profile owner
 * @param getProfileOffChain Function to fetch offchain user profiles
 * @param getEnsTextRecord Function to fetch ENS text records
 * @param getRessource Function to fetch a user profile
 * @param profileUrl Offchain user profile URL
 */
export const PROFILE_RECORD_NAME = 'network.dm3.profile';

export async function getEnsTextRecord(
    provider: ethers.providers.JsonRpcProvider,
    ensName: string,
    recordKey: string,
) {
    try {
        const resolver = await provider.getResolver(ensName);
        if (resolver === null) {
            return;
        }

        return await resolver.getText(recordKey);
    } catch (e) {
        return undefined;
    }
}

export async function getUserProfile(
    provider: ethers.providers.JsonRpcProvider,
    contact: string,
): Promise<SignedUserProfile | undefined> {
    const getResource = async (uri: string) => (await axios.get(uri)).data;
    const textRecord = await getEnsTextRecord(
        provider,
        contact,
        PROFILE_RECORD_NAME,
    );
    //The user has no dm3-Profile text record set. Hence we need to fetch the profile offChain
    if (!textRecord) {
        throw Error('Account has no dm3 profile');
    }
    /**
     * The Text record can contain either
     * * a link to the profile stored on a http server
     * * a link to the profile stored on ipfs
     * * The stringified profile
     */

    const resolver: ProfileResolver<SignedUserProfile>[] = [
        LinkResolver(getResource, validateSignedUserProfile),
        IpfsResolver(getResource, validateSignedUserProfile),
        JsonResolver(validateSignedUserProfile),
    ];

    const profile = await resolver
        .find((r) => r.isProfile(textRecord))
        ?.resolveProfile(textRecord);

    if (profile && !(await checkUserProfile(provider, profile, contact))) {
        throw Error(`Couldn't verify user profile`);
    }

    return profile;
}
