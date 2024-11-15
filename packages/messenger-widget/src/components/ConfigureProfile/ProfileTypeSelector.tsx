import { useContext, useEffect } from 'react';
import { ModalContext } from '../../context/ModalContext';
import { ProfileScreenType, ProfileType } from '../../utils/enum-type-utils';
import { BUTTON_CLASS } from './bl';

export function ProfileTypeSelector() {
    const { configureProfileModal, setConfigureProfileModal, disabledOptions } =
        useContext(ModalContext);

    const profileOptions = [
        {
            name: 'Claim a dm3 Name (dm3 cloud, Optimism, ...)',
            type: ProfileType.DM3_NAME,
            isEnabled: disabledOptions.profile.dm3.filter((d) => !d.value)
                .length
                ? true
                : false,
        },
        {
            name: 'use your own Name (ENS, GENOME, ...)',
            type: ProfileType.OWN_NAME,
            isEnabled: disabledOptions.profile.own.filter((d) => !d.value)
                .length
                ? true
                : false,
        },
    ];

    useEffect(() => {
        const filteredOptions = profileOptions.filter((p) => p.isEnabled);
        if (filteredOptions.length === 1) {
            setConfigureProfileModal({
                ...configureProfileModal,
                profileOptionSelected: filteredOptions[0].type,
            });
        }
    }, []);

    return (
        <div className="mt-4 ms-4 me-4 dm3-prof-select-container">
            <div className="dm3-prof-select-type">
                Add new dm3 profile - select type
            </div>

            <div className="prof-option-container">
                {profileOptions
                    .filter((p) => p.isEnabled)
                    .map((option, index) => (
                        <div
                            key={index}
                            className="radio d-flex mb-3 width-fit"
                            onClick={() =>
                                setConfigureProfileModal({
                                    ...configureProfileModal,
                                    profileOptionSelected: option.type,
                                })
                            }
                        >
                            <input
                                type="radio"
                                name="profile_name"
                                value={option.type}
                                checked={
                                    option.type ===
                                    configureProfileModal.profileOptionSelected
                                        ? true
                                        : false
                                }
                                readOnly
                            />
                            <label className="name-option radio-label">
                                {option.name}
                            </label>
                        </div>
                    ))}
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
                    className={BUTTON_CLASS.concat(' add-prof-btn-active')}
                    onClick={() => {
                        setConfigureProfileModal({
                            ...configureProfileModal,
                            onScreen: ProfileScreenType.SELECT_STORAGE,
                        });
                    }}
                >
                    Next ...
                </button>
            </div>
        </div>
    );
}
