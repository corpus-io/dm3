import { ITLDResolver } from './ITLDResolver';
import { getNameForAddress } from '../../../adapters/offchainResolverApi';
import { ethers } from 'ethers';

function getIdForAddress(address: string, addrEnsSubdomain: string) {
    return address + addrEnsSubdomain;
}

export class Dm3Name implements ITLDResolver {
    private readonly provider: ethers.providers.JsonRpcProvider;
    private readonly addrEnsSubdomain: string;
    private readonly userEnsSubdomain: string;
    private readonly resolverBackendUrl: string;

    constructor(
        provider: ethers.providers.JsonRpcProvider,
        addrEnsSubdomain: string,
        userEnsSubdomain: string,
        resolverBackendUrl: string,
    ) {
        this.provider = provider;
        this.addrEnsSubdomain = addrEnsSubdomain;
        this.userEnsSubdomain = userEnsSubdomain;

        this.resolverBackendUrl = resolverBackendUrl;
    }
    async isResolverForTldName(ensName: string): Promise<boolean> {
        const isUserSubDomain = ensName.endsWith(this.userEnsSubdomain);
        const hasDm3Profile = await this.hasDm3NameProfile(ensName);

        return isUserSubDomain && hasDm3Profile;
    }
    async isResolverForAliasName(ensName: string): Promise<boolean> {
        return ensName.endsWith(this.addrEnsSubdomain);
    }
    async resolveTLDtoAlias(ensName: string): Promise<string> {
        //Offchain resolver should retrieve the profile
        const address = await this.provider.resolveName(ensName);
        if (!address) {
            throw new Error('No address found for ' + ensName);
        }
        return getIdForAddress(
            ethers.utils.getAddress(address),
            this.addrEnsSubdomain,
        );
    }

    private async hasDm3NameProfile(ensName: string): Promise<boolean> {
        try {
            const ensNameHasAddress = await this.provider.resolveName(ensName);
            return !!ensNameHasAddress;
        } catch (err) {
            console.log(
                `Cant resolve Dm3name for ${ensName} to address error: ${err}`,
            );
            return false;
        }
    }

    //e.g. 0x1234.user.dm3.eth -> myname.user.dm3.eth
    async resolveAliasToTLD(ensName: string): Promise<string> {
        //For whatever reason the API accepts the address without the subdomain
        const addr = ensName.split('.')[0];
        const OFFCHAIN_RESOLVER_ADDRESS = this.resolverBackendUrl!;

        const dm3Name = await getNameForAddress(
            addr,
            OFFCHAIN_RESOLVER_ADDRESS,
        );
        return dm3Name ?? ensName;
    }
}
