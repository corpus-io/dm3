import { Lukso } from '@dm3-org/dm3-lib-smart-account';
import { ITLDResolver } from './ITLDResolver';

export class UniversalProfile implements ITLDResolver {
    private readonly luksoIndexer: Lukso.LuksoIndexer;
    private readonly addrEnsSubdomain: string;

    constructor(addrEnsSubdomain: string) {
        this.luksoIndexer = new Lukso.LuksoIndexer();
        this.addrEnsSubdomain = addrEnsSubdomain;
    }

    //e.g. alexcv#d7ab.up => 0x1234.addr.dm3.eth
    async isResolverForTldName(ensName: string): Promise<boolean> {
        //trim .up
        const [lspFullName] = ensName.split('.');
        const isUniversalProfile = await this.luksoIndexer.resolveName(
            lspFullName,
        );
        return !!isUniversalProfile;
    }

    //e.g. 0x1234.addr.dm3.eth => alexcv#d7ab.up
    async isResolverForAliasName(
        ensName: string,
        foreignTldName?: string,
    ): Promise<boolean> {
        const [address] = ensName.split('.');
        const isUniversalProfile = await this.luksoIndexer.resolveAddress(
            address,
        );
        return !!isUniversalProfile;
    }

    //e.g. 0x1234.addr.dm3.eth => alexcv#d7ab.up
    async resolveAliasToTLD(
        ensName: string,
        foreignTldName?: string,
    ): Promise<string> {
        const [address] = ensName.split('.');
        const aliasName = await this.luksoIndexer.resolveAddress(address);
        return aliasName! + '.up';
    }

    //e.g. alexcv#d7ab.up => 0x1234.addr.dm3.eth
    async resolveTLDtoAlias(ensName: string): Promise<string> {
        //trim .up
        const [lspFullName] = ensName.split('.');
        const addr = await this.luksoIndexer.resolveName(lspFullName);
        if (!addr) {
            throw new Error(
                'UniversalProfile TLDToAlias could not be resolved. No address found for ' +
                    lspFullName,
            );
        }
        return addr + this.addrEnsSubdomain;
    }
}
