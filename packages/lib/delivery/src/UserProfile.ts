import {
    ProfileValidator,
    SignedUserProfile,
    checkUserProfileWithAddress,
    getDefaultProfileExtension,
    normalizeEnsName,
} from '@dm3-org/dm3-lib-profile';
import { logDebug } from '@dm3-org/dm3-lib-shared';
import { ethers } from 'ethers';
import { generateAuthJWT } from '@dm3-org/dm3-lib-server-side';
import { Account } from './Account';

export async function submitUserProfile(
    luksoProvider: ethers.providers.BaseProvider,
    getAccount: (accountAddress: string) => Promise<Account | null>,
    setAccount: (accountAddress: string, account: Account) => Promise<void>,
    address: string,
    signedUserProfile: SignedUserProfile,
    serverSecret: string,
): Promise<string> {
    if (!ethers.utils.isAddress(address)) {
        logDebug('submitUserProfile - Invalid address');
        throw Error('Invalid address');
    }
    //normalize the address
    const _address = ethers.utils.getAddress(address);
    //     check if the submitted profile is has been signed by the adddress that want's to submit the profile

    const isValidProfile = await new ProfileValidator(luksoProvider).validate(
        signedUserProfile,
        _address,
    );

    if (!isValidProfile) {
        console.error({ signedUserProfile, _address });
        throw Error('submit user profile failed - invalid profile');
    }
    const account: Account = {
        account: _address,
        signedUserProfile,
        token: generateAuthJWT(_address, serverSecret),
        createdAt: new Date().getTime(),
        profileExtension: getDefaultProfileExtension(),
    };
    logDebug({ text: 'submitUserProfile', account });
    await setAccount(_address, account);

    return account.token;
}

// todo: remove this function (profiles should be loaded from chain and possibly cached)
export async function getUserProfile(
    getAccount: (accountAddress: string) => Promise<Account | null>,
    ensName: string,
): Promise<SignedUserProfile | undefined> {
    const accountName = normalizeEnsName(ensName);
    const account = await getAccount(accountName);
    return account?.signedUserProfile;
}
