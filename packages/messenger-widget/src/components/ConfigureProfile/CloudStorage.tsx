import { useContext, useState } from 'react';
import { ModalContext } from '../../context/ModalContext';
import { ProfileScreenType, ProfileType } from '../../utils/enum-type-utils';
import { BUTTON_CLASS, DM3_NAME_SERVICES, dm3NamingServices } from './bl';
import { ConfigureProfileContext } from './context/ConfigureProfileContext';
import { DM3ConfigurationContext } from '../../context/DM3ConfigurationContext';
import { ConfigureDM3NameContext } from './context/ConfigureDM3NameContext';

export function CloudStorage() {
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const { dm3NameServiceSelected, setDm3NameServiceSelected } = useContext(
        ConfigureProfileContext,
    );

    const { dm3Configuration } = useContext(DM3ConfigurationContext);

    const { existingDm3Name } = useContext(ConfigureDM3NameContext);

    const { configureProfileModal, setConfigureProfileModal, disabledOptions } =
        useContext(ModalContext);

    const isNameAlreadyConfigured = (): boolean => {
        if (
            existingDm3Name?.endsWith(dm3Configuration.userEnsSubdomain) &&
            dm3NameServiceSelected === DM3_NAME_SERVICES.CLOUD
        ) {
            setErrorMsg(
                'Cloud name is already configured, only one cloud name can be configured at a time',
            );
            return true;
        }
        if (
            existingDm3Name?.endsWith('.op.dm3.eth') &&
            dm3NameServiceSelected === DM3_NAME_SERVICES.OPTIMISM
        ) {
            setErrorMsg(
                'Optimism name is already configured, only one optimism name can be configured at a time',
            );
            return true;
        }
        return false;
    };

    const navigateToNextTab = () => {
        if (!isNameAlreadyConfigured()) {
            setErrorMsg(null);
            setConfigureProfileModal({
                ...configureProfileModal,
                onScreen: ProfileScreenType.CLAIM_NAME,
            });
        }
    };

    return (
        <>
            <div className="dm3-prof-select-type">
                Add new dm3 profile - claim dm3 profile - select storage
            </div>

            <div className="p-4">
                <div
                    className={
                        'conversation-error ms-0 mb-2 font-weight-400 show-error'
                    }
                >
                    {errorMsg ?? ''}
                </div>

                <div className="name-select-container">
                    <select
                        className="name-service-selector"
                        value={dm3NameServiceSelected}
                        onChange={(e) => {
                            setDm3NameServiceSelected(e.target.value);
                        }}
                    >
                        {dm3NamingServices &&
                            // Filter out disabled options and show only enabled options
                            dm3NamingServices
                                .filter(
                                    (d) =>
                                        disabledOptions.profile.dm3.filter(
                                            (p) => p.key === d.key && !p.value,
                                        ).length,
                                )
                                .map((data, index) => {
                                    return (
                                        <option value={data.name} key={index}>
                                            {data.name}
                                        </option>
                                    );
                                })}
                    </select>
                </div>

                <div className="mt-4 dm3-name-content">
                    <div className="small-text font-weight-300">
                        You can get a DM3 name for free. Please check if your
                        desired name is available. DM3 names are created and
                        managed on Layer2 (e.g. Optimism). Small transaction
                        costs will apply for setting the profile and
                        administration.
                    </div>
                    <div className="small-text font-weight-700">
                        You can receive messages sent to your full DM3 username.
                    </div>
                </div>
            </div>
            <div className="d-flex justify-content-end me-3 mb-3">
                <button
                    className={BUTTON_CLASS.concat(
                        ' ',
                        'config-profile-cancel-btn me-3',
                    )}
                    onClick={() => {
                        setConfigureProfileModal({
                            profileOptionSelected: ProfileType.DM3_NAME,
                            onScreen: ProfileScreenType.NONE,
                        });
                    }}
                >
                    Cancel
                </button>
                <button
                    className={BUTTON_CLASS.concat(' ', 'add-prof-btn-active')}
                    onClick={() => navigateToNextTab()}
                >
                    Next ...
                </button>
            </div>
        </>
    );
}
