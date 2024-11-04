import { ethers } from 'ethers';
import { Dm3Name } from './nameService/Dm3Name';
import { EthAddressResolver } from './nameService/EthAddress';
import { EthereumNameService } from './nameService/EthereumNameService';
import { ForeignName } from './nameService/ForeignName';
import { ITLDResolver } from './nameService/ITLDResolver';
import { OptimismNames } from './nameService/OptimismNames';
import { UniversalProfile } from './nameService/UniversalProfile';

const SUPPORTED_NAMESERVICES = (
    provider: ethers.providers.JsonRpcProvider,
    addressEnsSubdomain: string,
    userEnsSubdomain: string,
    resolverBackendUrl: string,
): ITLDResolver[] => [
    new EthereumNameService(provider, addressEnsSubdomain, userEnsSubdomain),
    new UniversalProfile(addressEnsSubdomain),
    //   new Genome(provider, addressEnsSubdomain),
    new OptimismNames(provider, addressEnsSubdomain),
    new ForeignName(provider, addressEnsSubdomain),
    new Dm3Name(
        provider,
        addressEnsSubdomain,
        userEnsSubdomain,
        resolverBackendUrl,
    ),
    new EthAddressResolver(addressEnsSubdomain),
];

export class Tld {
    private aliasTldCache: { [ensName: string]: string };
    private tldAliasCache: { [ensName: string]: string };
    private readonly mainnetProvider: ethers.providers.JsonRpcProvider;
    private readonly addressEnsSubdomain: string;
    private readonly userEnsSubdomain: string;
    private readonly resolverBackendUrl: string;

    constructor(
        mainnetProvider: ethers.providers.JsonRpcProvider,
        addressEnsSubdomain: string,
        userEnsSubdomain: string,
        resolverBackendUrl: string,
    ) {
        this.aliasTldCache = {};
        this.tldAliasCache = {};
        this.mainnetProvider = mainnetProvider;
        this.addressEnsSubdomain = addressEnsSubdomain;
        this.userEnsSubdomain = userEnsSubdomain;
        this.resolverBackendUrl = resolverBackendUrl;
    }
    //e.g. 0x1234.gnosis.eth -> 0x1234.gno
    resolveAliasToTLD = async (ensName: string, foreignTldName?: string) => {
        if (this.aliasTldCache[ensName]) {
            return this.aliasTldCache[ensName];
        }

        console.log('resolveAliasToTLD START', ensName, foreignTldName);

        for (const nameservice of SUPPORTED_NAMESERVICES(
            this.mainnetProvider,
            this.addressEnsSubdomain,
            this.userEnsSubdomain,
            this.resolverBackendUrl,
        )) {
            if (
                await nameservice.isResolverForAliasName(
                    ensName,
                    foreignTldName,
                )
            ) {
                const tldName = await nameservice.resolveAliasToTLD(
                    ensName,
                    foreignTldName,
                );
                this.aliasTldCache[ensName] = tldName;
                return tldName;
            }
        }
        return ensName;
    };
    //e.g. 0x1234.gno -> 0x1234.gnosis.eth
    resolveTLDtoAlias = async (ensName: string) => {
        if (this.tldAliasCache[ensName]) {
            return this.tldAliasCache[ensName];
        }
        for (const nameservice of SUPPORTED_NAMESERVICES(
            this.mainnetProvider,
            this.addressEnsSubdomain,
            this.userEnsSubdomain,
            this.resolverBackendUrl,
        )) {
            if (await nameservice.isResolverForTldName(ensName)) {
                const aliasName = await nameservice.resolveTLDtoAlias(ensName);
                this.tldAliasCache[ensName] = aliasName;
                return aliasName;
            }
        }
        return ensName;
    };
}
