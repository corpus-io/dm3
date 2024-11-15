/* eslint-disable max-len */
import { ethers } from 'ethers';
import { useContext, useEffect, useState } from 'react';
import { useChainId, useSwitchNetwork } from 'wagmi';
import { AuthContext } from '../../../../context/AuthContext';
import { ConfigureProfileContext } from '../../context/ConfigureProfileContext';
import { SubmitOnChainProfile } from '../SubmitOnChainProfile';
import { IChain, NAME_TYPE, validateEnsName } from '../common';
import { submitEnsNameTransaction } from './bl';
import { ModalContext } from '../../../../context/ModalContext';
import { ConfigureDM3NameContext } from '../../context/ConfigureDM3NameContext';
import { fetchChainIdFromServiceName } from '../../bl';
import { DM3ConfigurationContext } from '../../../../context/DM3ConfigurationContext';

export const ConfigureEnsProfile = (props: IChain) => {
    const connectedChainId = useChainId();

    const { switchNetwork } = useSwitchNetwork();

    const { setLoaderContent } = useContext(ModalContext);

    const { setDm3Name } = useContext(ConfigureDM3NameContext);

    const {
        onShowError,
        setExistingEnsName,
        setEnsName,
        namingServiceSelected,
    } = useContext(ConfigureProfileContext);

    const { account, ethAddress } = useContext(AuthContext);

    const { dm3Configuration } = useContext(DM3ConfigurationContext);

    const [ethereumName, setEthereumName] = useState<string>('');

    const provider = new ethers.providers.Web3Provider(
        window.ethereum as ethers.providers.ExternalProvider,
    );

    // changes network on GNO naming service change
    const changeNetwork = async (ethName: string) => {
        const chainId = fetchChainIdFromServiceName(
            namingServiceSelected,
            dm3Configuration.chainId,
        );
        if (chainId && chainId !== connectedChainId && switchNetwork) {
            switchNetwork(chainId);
            setEthereumName(ethName);
        } else {
            await registerAndPublish(ethName);
        }
    };

    const onSubmitTx = async (ethName: string) => {
        changeNetwork(ethName);
    };

    const registerAndPublish = async (ethName: string) => {
        if (props.chainToConnect !== connectedChainId) {
            onShowError(
                NAME_TYPE.ENS_NAME,
                'Invalid chain connected. Please switch to Ethereum network.',
            );
            return;
        }
        await submitEnsNameTransaction(
            provider!,
            account!,
            ethAddress!,
            setLoaderContent,
            ethName,
            (str: string) => setExistingEnsName(str),
            onShowError,
        );
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onShowError(undefined, '');
        setDm3Name('');
        const check = validateEnsName(e.target.value);
        setEnsName(e.target.value);
        if (!check) {
            onShowError(NAME_TYPE.ENS_NAME, 'Invalid ENS name');
        }
    };

    // on change of network by user, ENS name is published
    useEffect(() => {
        if (
            connectedChainId ===
                fetchChainIdFromServiceName(
                    namingServiceSelected,
                    dm3Configuration.chainId,
                ) &&
            ethereumName.length
        ) {
            registerAndPublish(ethereumName);
        }
    }, [connectedChainId]);

    // on change of dropdown selected, error vanishes
    useEffect(() => {
        onShowError(undefined, '');
        setEnsName('');
    }, [namingServiceSelected]);

    const propertyName = 'ENS Name';

    const label =
        'To publish your dm3 profile, a transaction is sent to set a text record in your ENS name. Transaction costs will apply for setting the profile and administration.';
    const note = 'You can receive dm3 messages directly sent to your ENS name.';
    const placeholder = 'Enter your ENS name connected to your wallet';

    return (
        <SubmitOnChainProfile
            propertyName={propertyName}
            handleNameChange={handleNameChange}
            label={label}
            note={note}
            placeholder={placeholder}
            onSubmitTx={onSubmitTx}
        />
    );
};
