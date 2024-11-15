import { ethers } from 'ethers';
import { checkEnsDM3Text } from '../../utils/ens-utils';
import { log } from '@dm3-org/dm3-lib-shared';
import { closeLoader, startLoader } from '../Loader/Loader';
import { ConfigureEnsProfile } from './chain/ens/ConfigureEnsProfile';
import { Dm3Name } from '../../hooks/topLevelAlias/nameService/Dm3Name';
import { ConfigureGenomeProfile } from './chain/genome/ConfigureGenomeProfile';
import { Account, ProfileKeys, hasUserProfile } from '@dm3-org/dm3-lib-profile';
import { ConfigureCloudNameProfile } from './dm3Names/cloudName/ConfigureCloudNameProfile';
import { ConfigureOptimismNameProfile } from './dm3Names/optimismName/ConfigureOptimismNameProfile';
import { supportedChains } from '../../utils/common-utils';
import { removeAlias } from '../../adapters/offchainResolverApi';
import { PREFERENCES_ITEMS } from '../Preferences/bl';

export const PROFILE_INPUT_FIELD_CLASS =
    'profile-input font-weight-400 font-size-14 border-radius-6 w-100 line-height-24';

export const BUTTON_CLASS =
    'configure-btn font-weight-400 font-size-12 border-radius-4 line-height-24';

export enum ACTION_TYPE {
    CONFIGURE,
    REMOVE,
}

// method to open the profile configuration modal
export const openConfigurationModal = (
    setShowProfileConfigurationModal: (show: boolean) => void,
    setShowPreferencesModal: (show: boolean) => void,
    updatePreferenceSelected: (ticker: PREFERENCES_ITEMS | null) => void,
) => {
    setShowProfileConfigurationModal(true);
    setShowPreferencesModal(true);
    updatePreferenceSelected(PREFERENCES_ITEMS.DM3_PROFILE);
};

// method to close the profile configuration modal
export const closeConfigurationModal = (
    setShowProfileConfigurationModal: (show: boolean) => void,
) => {
    setShowProfileConfigurationModal(false);
};

// method to fetch ENS name
export const getEnsName = async (
    mainnetProvider: ethers.providers.StaticJsonRpcProvider,
    ethAddress: string,
    account: Account,
    setEnsNameFromResolver: Function,
    addrEnsSubdomain: string,
) => {
    try {
        if (ethAddress) {
            const isAddrEnsName = account.ensName?.endsWith(addrEnsSubdomain);
            const name = await mainnetProvider.lookupAddress(ethAddress);
            if (name && !isAddrEnsName) {
                const hasProfile = await hasUserProfile(mainnetProvider, name);
                const dm3ProfileRecordExists = await checkEnsDM3Text(
                    mainnetProvider,
                    name,
                );
                hasProfile &&
                    dm3ProfileRecordExists &&
                    setEnsNameFromResolver(name);
            }
        }
    } catch (error) {
        log(error, 'Configure profile');
    }
};

// method to remove alias
export const removeAliasFromDm3Name = async (
    resolverBackendUrl: string,
    profileKeys: ProfileKeys,
    dm3UserEnsName: string,
    setLoaderContent: (content: string) => void,
    setError: Function,
) => {
    try {
        setLoaderContent('Removing alias...');
        startLoader();

        const result = await removeAlias(
            dm3UserEnsName,
            resolverBackendUrl as string,
            profileKeys.signingKeyPair.privateKey,
        );

        closeLoader();
        return result;
    } catch (e) {
        setError('Failed to remove alias', e);
        closeLoader();
        return false;
    }
};
export const validateName = (username: string, serviceType: string) => {
    if (username.length < 4) {
        return {
            isValid: false,
            error: 'Invalid name, please provide a name that is at least 4 characters long',
        };
    }
    if (serviceType !== DM3_NAME_SERVICES.OPTIMISM && username.includes('.')) {
        return {
            isValid: false,
            error: 'Invalid name, should not contain dots',
        };
    }
    if (!ethers.utils.isValidName(username)) {
        return {
            isValid: false,
            error: 'Invalid name, should not contain special characters',
        };
    }
    return {
        isValid: true,
        error: '',
    };
};

export const fetchExistingDM3Name = async (
    resolverBackendUrl: string,
    mainnetProvider: ethers.providers.StaticJsonRpcProvider,
    account: Account,
    setExistingDm3Name: Function,
    addrEnsSubdomain: string,
    userEnsSubdomain: string,
) => {
    try {
        if (account) {
            const dm3NameService = new Dm3Name(
                mainnetProvider,
                addrEnsSubdomain,
                userEnsSubdomain,
                resolverBackendUrl,
            );
            const dm3Name = await dm3NameService.resolveAliasToTLD(
                account.ensName,
            );
            // Not a DM3 name -> 0xa966.beta-addr.dm3.eth
            // Its DM3 name -> bob.beta-user.dm3.eth
            // Checks user sub domain for setting DM3 name
            setExistingDm3Name(
                dm3Name.endsWith(userEnsSubdomain) ? dm3Name : null,
            );
        } else {
            setExistingDm3Name(null);
        }
    } catch (error) {
        console.log('dm3 name : ', error);
        setExistingDm3Name(null);
    }
};

export const enum NAME_SERVICES {
    ENS = 'Ethereum Network - Ethereum Name Service (ENS)',
    GENOME = 'Gnosis Network - Genome/SpaceID',
    OPTIMISM = 'Optimism Network',
}

export const namingServices = [
    {
        name: NAME_SERVICES.ENS,
        key: 'ens',
        chainId: supportedChains.ethereumMainnet,
    },
    {
        name: NAME_SERVICES.GENOME,
        key: 'gnosis',
        chainId: supportedChains.gnosisMainnet,
    },
];

export const fetchComponent = (name: string, chainId: string) => {
    switch (name) {
        case NAME_SERVICES.ENS:
            if (Number(chainId) === supportedChains.ethereumTestnet) {
                return (
                    <ConfigureEnsProfile
                        chainToConnect={supportedChains.ethereumTestnet}
                    />
                );
            }
            return (
                <ConfigureEnsProfile
                    chainToConnect={supportedChains.ethereumMainnet}
                />
            );
        case NAME_SERVICES.GENOME:
            const genomeChainId = supportedChains.gnosisMainnet;
            return <ConfigureGenomeProfile chainToConnect={genomeChainId} />;
    }
};

export const fetchServiceFromChainId = (chainId: number): string => {
    namingServices.forEach((data) => {
        if (data.chainId === chainId) {
            return data.name;
        }
    });
    return namingServices[0].name;
};

export const fetchChainIdFromServiceName = (name: string, chainId: string) => {
    switch (name) {
        case NAME_SERVICES.ENS:
            if (Number(chainId) === supportedChains.ethereumTestnet) {
                return supportedChains.ethereumTestnet;
            }
            return supportedChains.ethereumMainnet;
        case NAME_SERVICES.GENOME:
            return supportedChains.gnosisMainnet;
        default:
            return supportedChains.ethereumMainnet;
    }
};

export const enum DM3_NAME_SERVICES {
    CLOUD = 'Cloud-Service by dm3 (... .user.dm3.eth)',
    OPTIMISM = 'Optimism (... .op.dm3.eth)',
}

export const dm3NamingServices = [
    {
        name: DM3_NAME_SERVICES.CLOUD,
        key: 'dm3',
    },
    {
        name: DM3_NAME_SERVICES.OPTIMISM,
        key: 'optimism',
    },
];

export const fetchDM3NameComponent = (
    name: string,
    envConfiguredChainId: string,
) => {
    switch (name) {
        case DM3_NAME_SERVICES.CLOUD:
            return <ConfigureCloudNameProfile />;
        case DM3_NAME_SERVICES.OPTIMISM:
            const chainToConnect =
                Number(envConfiguredChainId) === supportedChains.ethereumTestnet
                    ? supportedChains.optimismTestnet
                    : supportedChains.optimismMainnet;
            return (
                <ConfigureOptimismNameProfile chainToConnect={chainToConnect} />
            );
    }
};

export const fetchChainIdFromDM3ServiceName = (
    name: string,
    envConfiguredChainId: string,
) => {
    switch (name) {
        case DM3_NAME_SERVICES.CLOUD:
            if (
                Number(envConfiguredChainId) === supportedChains.ethereumTestnet
            ) {
                return Number(supportedChains.ethereumTestnet);
            }
            return supportedChains.ethereumMainnet;
        case DM3_NAME_SERVICES.OPTIMISM:
            if (
                Number(envConfiguredChainId) === supportedChains.ethereumTestnet
            ) {
                return supportedChains.optimismTestnet;
            }
            return supportedChains.optimismMainnet;
        default:
            return supportedChains.ethereumMainnet;
    }
};
