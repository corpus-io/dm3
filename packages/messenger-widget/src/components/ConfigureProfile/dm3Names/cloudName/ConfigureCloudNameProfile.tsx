import { useContext, useEffect } from 'react';
import { DM3Name } from '../DM3Name';
import { NAME_TYPE } from '../../chain/common';
import { AuthContext } from '../../../../context/AuthContext';
import { closeLoader, startLoader } from '../../../Loader/Loader';
import { claimSubdomain } from '../../../../adapters/offchainResolverApi';
import { ConfigureDM3NameContext } from '../../context/ConfigureDM3NameContext';
import { DM3ConfigurationContext } from '../../../../context/DM3ConfigurationContext';
import { ModalContext } from '../../../../context/ModalContext';
import { ConfigureProfileContext } from '../../context/ConfigureProfileContext';
import { ProfileScreenType } from '../../../../utils/enum-type-utils';

export const ConfigureCloudNameProfile = () => {
    const { setLoaderContent } = useContext(ModalContext);

    const { dm3Configuration } = useContext(DM3ConfigurationContext);

    const { configureProfileModal, setConfigureProfileModal } =
        useContext(ModalContext);

    const { dm3NameServiceSelected } = useContext(ConfigureProfileContext);

    const { setExistingDm3Name, setError, setDm3Name } = useContext(
        ConfigureDM3NameContext,
    );

    const { account, profileKeys, setDisplayName } = useContext(AuthContext);

    const nameExtension = dm3Configuration.userEnsSubdomain;
    const placeholder = 'Enter your preferred name and check availability.';

    // Set new cloud DM3 username
    const submitDm3UsernameClaim = async (dm3UserEnsName: string) => {
        try {
            // start loader
            setLoaderContent('Publishing profile...');
            startLoader();

            const ensName = dm3UserEnsName! + dm3Configuration.userEnsSubdomain;

            if (profileKeys) {
                await claimSubdomain(
                    dm3UserEnsName! + dm3Configuration.userEnsSubdomain,
                    dm3Configuration.resolverBackendUrl as string,
                    account!.ensName,
                    profileKeys.signingKeyPair.privateKey,
                );

                setDisplayName(ensName);
                setExistingDm3Name(ensName);
                setConfigureProfileModal({
                    ...configureProfileModal,
                    onScreen: ProfileScreenType.NONE,
                });
            }
        } catch (e) {
            setError('Name is not available', NAME_TYPE.DM3_NAME);
        }

        // stop loader
        closeLoader();
    };

    // on change of dropdown selected, error vanishes
    useEffect(() => {
        setError('', undefined);
        setDm3Name('');
    }, [dm3NameServiceSelected]);

    return (
        <DM3Name
            nameExtension={nameExtension}
            placeholder={placeholder}
            submitDm3UsernameClaim={submitDm3UsernameClaim}
        />
    );
};
