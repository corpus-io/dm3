import { useContext, useState } from 'react';
import { ModalContext } from '../../context/ModalContext';
import { ProfileScreenType, ProfileType } from '../../utils/enum-type-utils';
import { BUTTON_CLASS, NAME_SERVICES, namingServices } from './bl';
import { ConfigureProfileContext } from './context/ConfigureProfileContext';

export function OwnStorage() {
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const { configureProfileModal, setConfigureProfileModal, disabledOptions } =
        useContext(ModalContext);

    const { existingEnsName, namingServiceSelected, setNamingServiceSelected } =
        useContext(ConfigureProfileContext);

    const isNameAlreadyConfigured = (): boolean => {
        if (
            (existingEnsName?.endsWith('.gno') ||
                existingEnsName?.endsWith('.gnosis.eth')) &&
            namingServiceSelected === NAME_SERVICES.GENOME
        ) {
            setErrorMsg(
                'GNO name is already configured, only one GNO name can be configured at a time',
            );
            return true;
        }
        if (
            existingEnsName?.endsWith('.eth') &&
            namingServiceSelected === NAME_SERVICES.ENS
        ) {
            setErrorMsg(
                'ENS name is already configured, only one ENS name can be configured at a time',
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
                Add new dm3 profile - claim DM3 profile - select storage
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
                        value={namingServiceSelected}
                        onChange={(e) => {
                            setNamingServiceSelected(e.target.value);
                        }}
                    >
                        {namingServices &&
                            // Filter out disabled options and show only enabled options
                            namingServices
                                .filter(
                                    (n) =>
                                        disabledOptions.profile.own.filter(
                                            (p) => p.key === n.key && !p.value,
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
                        To publish your dm3 profile, a transaction is sent to
                        set a text record in your ENS name or GNO name.
                        Transaction costs will apply for setting the profile and
                        administration.
                    </div>
                    <div className="small-text font-weight-700">
                        You can receive dm3 messages directly sent to your ENS
                        name or GNO name
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
