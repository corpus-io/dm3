import { ethers } from 'ethers';
import { ITLDResolver } from './ITLDResolver';

export class EthAddressResolver implements ITLDResolver {
    private readonly addrEnsSubdomain: string;

    constructor(addrEnsSubdomain: string) {
        this.addrEnsSubdomain = addrEnsSubdomain;
    }
    async isResolverForTldName(ensName: string): Promise<boolean> {
        return ethers.utils.isAddress(ensName);
    }
    async isResolverForAliasName(ensName: string): Promise<boolean> {
        return ensName.endsWith(this.addrEnsSubdomain);
    }
    //The alias format is used to display in the UI
    //e.g. 0x1234.user.dm3.eth -> 0x1234
    async resolveAliasToTLD(ensName: string): Promise<string> {
        return ensName.split('.')[0];
    }
    //The alias format is used to store the contact in the DB
    //e.g. 0x1234 -> 0x1234.user.dm3.eth
    async resolveTLDtoAlias(address: string): Promise<string> {
        return address + this.addrEnsSubdomain;
    }
}
