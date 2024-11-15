import { Account, SignedUserProfile } from '@dm3-org/dm3-lib-profile';
import { ethersHelper, stringify } from '@dm3-org/dm3-lib-shared';
import { ethers } from 'ethers';
import { getDm3NameRegistrar } from './getDm3NameRegistrar';

export const publishProfile = async (
    opProvider: ethers.providers.StaticJsonRpcProvider,
    account: Account,
    ensName: string,
) => {
    const dm3NameRegistrar = getDm3NameRegistrar(opProvider);
    if (!account) {
        throw Error('No account');
    }
    if (!account.profile) {
        throw Error('No profile');
    }
    if (!account.profileSignature) {
        throw Error('No signature');
    }
    const signedUserProfile: SignedUserProfile = {
        profile: account.profile,
        signature: account.profileSignature,
    };

    const node = ethers.utils.namehash(ensName);

    const jsonPrefix = 'data:application/json,';
    const key = 'network.dm3.profile';
    const value = jsonPrefix + stringify(signedUserProfile);

    console.log('reg ', dm3NameRegistrar);

    const publishProfileTx = await ethersHelper.executeTransaction({
        method: dm3NameRegistrar.setText,
        args: [node, key, value],
    });
    console.log('publishProfile Tx res', publishProfileTx);
    await publishProfileTx.wait();
    return true;
};
