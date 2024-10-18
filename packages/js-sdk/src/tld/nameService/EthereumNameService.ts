import { ITLDResolver } from './ITLDResolver';
import { ethers } from 'ethers';

function getIdForAddress(address: string, addrEnsSubdomain: string) {
    return address + addrEnsSubdomain;
}

export class EthereumNameService implements ITLDResolver {
    private readonly provider: ethers.providers.JsonRpcProvider;
    private readonly addrEnsSubdomain: string;
    private readonly userEnsSubdomain: string;

    constructor(
        provider: ethers.providers.JsonRpcProvider,
        addrEnsSubdomain: string,
        userEnsSubdomain: string,
    ) {
        this.provider = provider;
        this.addrEnsSubdomain = addrEnsSubdomain;
        this.userEnsSubdomain = userEnsSubdomain;
    }

    //e.g. max.eth => 0x1234.addr.dm3.eth
    async isResolverForTldName(ensName: string): Promise<boolean> {
        const isUserSubdomain = ensName.endsWith(this.userEnsSubdomain);
        const isAddrSubdomain = ensName.endsWith(this.addrEnsSubdomain);
        const isEnsDomain = ensName.endsWith('.eth');

        if (isUserSubdomain || isAddrSubdomain || !isEnsDomain) {
            return false;
        }

        return this.hasDm3ProfileOnEnsProfile(ensName);
    }
    //e.g. max.eth => 0x1234.addr.dm3.eth
    async resolveTLDtoAlias(ensName: string): Promise<string> {
        const address = await this.provider.resolveName(ensName);
        if (!address) {
            throw new Error('No address found for ' + ensName);
        }
        return getIdForAddress(
            ethers.utils.getAddress(address),
            this.addrEnsSubdomain,
        );
    }
    //e.g. 0x1234.addr.dm3.eth => max.eth
    async isResolverForAliasName(ensName: string): Promise<boolean> {
        const address = ensName.split('.')[0];
        if (!ethers.utils.isAddress(address)) {
            return false;
        }
        const resolvedName = await this.provider.lookupAddress(address);
        if (!resolvedName) {
            return false;
        }
        return this.hasDm3ProfileOnEnsProfile(resolvedName);
    }
    //e.g. 0x1234.addr.dm3.eth => max.eth
    async resolveAliasToTLD(ensName: string): Promise<string> {
        const address = ensName.split('.')[0];
        const resolvedName = await this.provider.lookupAddress(address);
        return resolvedName ?? ensName;
    }

    private async hasDm3ProfileOnEnsProfile(ensName: string): Promise<boolean> {
        try {
            const ensNameHasAddress = await this.provider.resolveName(ensName);
            const resolver = await this.provider.getResolver(ensName);
            if (!resolver) {
                return false;
            }
            const dm3Profile = await resolver.getText('network.dm3.profile');

            if (!dm3Profile) {
                return false;
            }

            return !!ensNameHasAddress;
        } catch (err) {
            console.log(
                `Cant resolve ENSname ${ensName} to address error: ${err}`,
            );
            return false;
        }
    }
}
