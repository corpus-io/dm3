//The profile validator ensures that a submitted Dm3 profile is actuall valid
//It supports
//1. Profiles signed by an EOA
//2. Profiles signed by an Lukso Universal profile

import { stringify } from '@dm3-org/dm3-lib-shared';
import { ethers } from 'ethers';
import ERC725Abi from './ERC725Abi.json';
import {
    checkUserProfileWithAddress,
    getProfileCreationMessage,
} from '../Profile';
import { SignedUserProfile } from '../types';

//ERC-1271 constants can be found at lsp6-contracts/contracts/constants.sol
const ERC1271_SUCCESSVALUE = '0x1626ba7e';

export class ProfileValidator {
    private readonly luksoProvider: ethers.providers.BaseProvider;
    constructor(luksoProvider: ethers.providers.BaseProvider) {
        this.luksoProvider = luksoProvider;
    }
    //Check if a profile is signed by the owner of the address
    //This method is used for every profile created by an EOA
    private async isDm3AddressProfile(
        signedUserProfile: SignedUserProfile,
        address: string,
    ): Promise<boolean> {
        const isValid = await checkUserProfileWithAddress(
            signedUserProfile,
            address,
        );

        if (!isValid) {
            console.error('invalid dm3 address profile', {
                signedUserProfile,
                address,
            });
        }
        return isValid;
    }
    //Check if a profile is signed by one of the UP controllers
    //This method is used for every universal profile
    private async isLuksoProfile(
        signedUserProfile: SignedUserProfile,
        address: string,
    ) {
        const upContract = new ethers.Contract(
            address,
            ERC725Abi,
            this.luksoProvider,
        );
        //Get the message that the up users has signed earlier to create their profile
        const profileCreationMessage = getProfileCreationMessage(
            stringify(signedUserProfile.profile),
            //address has to be the UP address
            address,
        );
        //Hash the message
        const messageHash = ethers.utils.hashMessage(profileCreationMessage);

        //Use ERC-1271 to check if the profile has been signed by one of the UP controllers
        try {
            const res = await upContract.isValidSignature(
                messageHash,
                signedUserProfile.signature,
            );
            return res === ERC1271_SUCCESSVALUE;
        } catch (e) {
            console.error('error validating lukso-up', {
                signedUserProfile,
                address,
            });
            console.error(e);
            return false;
        }
    }

    public async validate(
        signedUserProfile: SignedUserProfile,
        address: string,
    ): Promise<boolean> {
        return (
            (await this.isDm3AddressProfile(signedUserProfile, address)) ||
            (await this.isLuksoProfile(signedUserProfile, address))
        );
    }
}
