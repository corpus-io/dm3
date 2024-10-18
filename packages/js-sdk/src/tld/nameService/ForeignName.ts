import { ethers } from 'ethers';
import { ITLDResolver } from './ITLDResolver';
import { normalizeEnsName } from '@dm3-org/dm3-lib-profile';

function getIdForAddress(address: string, addrEnsSubdomain: string) {
    return address + addrEnsSubdomain;
}

//A foreign name is an offchain name that has not been created by the client the users uses but by another 3rd part
//A good example would be the Dm3 messenger widget used in implementation others than the Dm3 reference implementation
//
export class ForeignName implements ITLDResolver {
    private readonly addrEnsSubdomain: string;
    private readonly provider: ethers.providers.JsonRpcProvider;

    constructor(
        provider: ethers.providers.JsonRpcProvider,
        addrEnsSubdomain: string,
    ) {
        this.provider = provider;
        this.addrEnsSubdomain = addrEnsSubdomain;
    }

    isResolverForTldName(ensName: string): Promise<boolean> {
        //check if the domain is part of the clients namespace
        const isAddressDomainOfClient = ensName.endsWith(this.addrEnsSubdomain);

        //if not it is indeed a foreign name
        return Promise.resolve(!isAddressDomainOfClient);
    }
    isResolverForAliasName(
        ensName: string,
        foreinAliasName?: string,
    ): Promise<boolean> {
        console.log('isResolverForForeignAliasName', ensName, foreinAliasName);
        if (!foreinAliasName) {
            return Promise.resolve(false);
        }
        return Promise.resolve(
            normalizeEnsName(ensName) !== normalizeEnsName(foreinAliasName),
        );
    }
    resolveAliasToTLD(
        ensName: string,
        foreinAliasName?: string,
    ): Promise<string> {
        if (!foreinAliasName) {
            //This message should only be called if isResolverForAliasName returned true previously
            throw new Error('No foreign alias name provided');
        }
        return Promise.resolve(foreinAliasName!);
    }
    async resolveTLDtoAlias(ensName: string): Promise<string> {
        const address = await this.provider.resolveName(ensName);
        if (!address) {
            console.log('No address found for ' + ensName);
            return ensName;
        }
        return getIdForAddress(
            ethers.utils.getAddress(address),
            this.addrEnsSubdomain,
        );
    }
}
