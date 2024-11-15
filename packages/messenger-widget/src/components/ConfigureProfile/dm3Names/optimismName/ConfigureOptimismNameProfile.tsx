import { ethers } from 'ethers';
import { useContext, useEffect, useState } from 'react';
import { useChainId, useSwitchNetwork } from 'wagmi';
import { AuthContext } from '../../../../context/AuthContext';
import { ConfigureDM3NameContext } from '../../context/ConfigureDM3NameContext';
import { closeLoader, startLoader } from '../../../Loader/Loader';
import { IChain, NAME_TYPE } from '../../chain/common';
import { DM3Name } from '../DM3Name';
import { publishProfile } from './tx/publishProfile';
import { registerOpName } from './tx/registerOpName';
import { ModalContext } from '../../../../context/ModalContext';
import { fetchChainIdFromDM3ServiceName } from '../../bl';
import { DM3ConfigurationContext } from '../../../../context/DM3ConfigurationContext';
import { ConfigureProfileContext } from '../../context/ConfigureProfileContext';
import { ProfileScreenType } from '../../../../utils/enum-type-utils';

export const ConfigureOptimismNameProfile = (props: IChain) => {
    const connectedChainId = useChainId();

    const { switchNetwork } = useSwitchNetwork();

    const {
        setLoaderContent,
        configureProfileModal,
        setConfigureProfileModal,
    } = useContext(ModalContext);

    const { account, setDisplayName } = useContext(AuthContext);

    const { dm3Configuration } = useContext(DM3ConfigurationContext);

    const { dm3NameServiceSelected } = useContext(ConfigureProfileContext);

    const { setExistingDm3Name, setError, setDm3Name } = useContext(
        ConfigureDM3NameContext,
    );

    const [optimismName, setOptimismName] = useState<string>('');

    // Modify it as per actual op name extension. It's written as per figma design.
    const nameExtension = '.op.dm3.eth';
    const placeholder = 'Enter your preferred name and check availability.';

    const changeNetwork = async (opName: string) => {
        const chainId = fetchChainIdFromDM3ServiceName(
            dm3NameServiceSelected,
            dm3Configuration.chainId,
        );
        if (chainId && chainId !== connectedChainId && switchNetwork) {
            switchNetwork(chainId);
            setOptimismName(opName);
        } else {
            await registerAndPublish(opName);
        }
    };

    const registerOpNameAndPublishProfile = async (opName: string) => {
        changeNetwork(opName);
    };

    const registerAndPublish = async (opName: string) => {
        try {
            // start loader
            setLoaderContent('Claim OP name...');
            startLoader();

            if (props.chainToConnect !== connectedChainId) {
                setError(
                    'Invalid chain connected. Please switch to optimism network.',
                    NAME_TYPE.DM3_NAME,
                );
                closeLoader();

                return;
            }
            const opProvider = new ethers.providers.Web3Provider(
                window.ethereum as ethers.providers.ExternalProvider,
            );
            const opParentDomain = '.op.dm3.eth';
            const ensName = `${opName}${opParentDomain}`;
            const registerNameRes = await registerOpName(
                opProvider,
                setError,
                ensName,
            );

            if (!registerNameRes) {
                closeLoader();
                return;
            }

            setLoaderContent('Publishing profile...');
            await publishProfile(opProvider, account!, ensName);

            setDisplayName(ensName);
            setExistingDm3Name(ensName);
            setConfigureProfileModal({
                ...configureProfileModal,
                onScreen: ProfileScreenType.NONE,
            });
        } catch (e) {
            // check user rejects
            setError('Name is not available', NAME_TYPE.DM3_NAME);
        }

        // stop loader
        closeLoader();
    };

    // on change of network by user, OP name is published
    useEffect(() => {
        if (
            connectedChainId ===
                fetchChainIdFromDM3ServiceName(
                    dm3NameServiceSelected,
                    dm3Configuration.chainId,
                ) &&
            optimismName.length
        ) {
            registerAndPublish(optimismName);
        }
    }, [connectedChainId]);

    // on change of dropdown selected, error vanishes
    useEffect(() => {
        setError('', undefined);
        setDm3Name('');
    }, [dm3NameServiceSelected]);

    return (
        <DM3Name
            nameExtension={nameExtension}
            placeholder={placeholder}
            submitDm3UsernameClaim={registerOpNameAndPublishProfile}
        />
    );
};
