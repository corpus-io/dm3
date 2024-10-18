import { SignedUserProfile } from '@dm3-org/dm3-lib-profile';
import axios from 'axios';

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
