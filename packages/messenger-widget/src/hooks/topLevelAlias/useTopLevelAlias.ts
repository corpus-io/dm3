import { ethers } from 'ethers';
import { useContext, useState } from 'react';
import { Dm3Name } from './nameService/Dm3Name';
import { EthAddressResolver } from './nameService/EthAddress';
import { EthereumNameService } from './nameService/EthereumNameService';
import { Genome } from './nameService/Genome';
import { useMainnetProvider } from '../mainnetprovider/useMainnetProvider';
import { DM3ConfigurationContext } from '../../context/DM3ConfigurationContext';
import { OptimismNames } from './nameService/OptimismNames';
import { DM3Configuration } from '../../interfaces/config';
import { ITLDResolver } from './nameService/ITLDResolver';
import { ForeignName } from './nameService/ForeignName';
import { UniversalProfile } from './nameService/UniversalProfile';
import { normalizeEnsName } from '@dm3-org/dm3-lib-profile';

const SUPPORTED_NAMESERVICES = (
    provider: ethers.providers.JsonRpcProvider,
    {
        addressEnsSubdomain,
        userEnsSubdomain,
        resolverBackendUrl,
    }: DM3Configuration,
): ITLDResolver[] => [
    new EthereumNameService(provider, addressEnsSubdomain, userEnsSubdomain),
    new UniversalProfile(addressEnsSubdomain),
    new Genome(provider, addressEnsSubdomain),
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

export type TldAliasCache = {
    [ensName: string]: string;
};

export const useTopLevelAlias = () => {
    const mainnetProvider = useMainnetProvider();
    const { dm3Configuration } = useContext(DM3ConfigurationContext);
    const [tldAliasCache, setTldAliasCache] = useState<TldAliasCache>({});
    const [aliasTldCache, setAliasTldCache] = useState<TldAliasCache>({});

    //e.g. 0x1234.gnosis.eth -> 0x1234.gno
    const resolveAliasToTLD = async (
        ensName: string,
        foreignTldName?: string,
    ) => {
        if (aliasTldCache[ensName]) {
            return aliasTldCache[ensName];
        }

        console.log('resolveAliasToTLD START', ensName, foreignTldName);

        for (const nameservice of SUPPORTED_NAMESERVICES(
            mainnetProvider,
            dm3Configuration,
        )) {
            if (
                await nameservice.isResolverForAliasName(
                    ensName,
                    foreignTldName,
                )
            ) {
                const tldName = normalizeEnsName(
                    await nameservice.resolveAliasToTLD(
                        ensName,
                        foreignTldName,
                    ),
                );
                setAliasTldCache((prev) => ({ ...prev, [ensName]: tldName }));
                return tldName;
            }
        }
        return ensName;
    };
    //e.g. 0x1234.gno -> 0x1234.gnosis.eth
    const resolveTLDtoAlias = async (ensName: string) => {
        if (tldAliasCache[ensName]) {
            return tldAliasCache[ensName];
        }
        for (const nameservice of SUPPORTED_NAMESERVICES(
            mainnetProvider,
            dm3Configuration,
        )) {
            if (await nameservice.isResolverForTldName(ensName)) {
                const aliasName = normalizeEnsName(
                    await nameservice.resolveTLDtoAlias(ensName),
                );
                setTldAliasCache((prev) => ({ ...prev, [ensName]: aliasName }));
                return aliasName;
            }
        }
        return ensName;
    };

    return {
        resolveAliasToTLD,
        resolveTLDtoAlias,
    };
};
