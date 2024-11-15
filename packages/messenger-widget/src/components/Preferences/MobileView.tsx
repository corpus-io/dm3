import './Preferences.css';
import { useContext, useEffect } from 'react';
import closeIcon from '../../assets/images/cross.svg';
import { closeConfigurationModal } from '../ConfigureProfile/bl';
import { ModalContext } from '../../context/ModalContext';

export function MobileView() {
    const {
        setShowPreferencesModal,
        showProfileConfigurationModal,
        setShowProfileConfigurationModal,
        resetConfigureProfileModal,
        preferencesOptionSelected,
        preferencesOptions,
        updatePreferenceSelected,
    } = useContext(ModalContext);

    /**
     *  Opens first option by default
     */
    useEffect(() => {
        if (showProfileConfigurationModal && !preferencesOptionSelected) {
            updatePreferenceSelected(
                preferencesOptions.length ? preferencesOptions[0].ticker : null,
            );
        }
    }, []);

    // reset states of configure profile modal if any other component is loaded
    useEffect(() => {
        if (
            preferencesOptionSelected &&
            preferencesOptionSelected.name !== 'dm3 Profile'
        ) {
            resetConfigureProfileModal();
        }
    }, [preferencesOptionSelected]);

    return (
        <div>
            <div
                id="preferences-modal"
                className="modal-container position-fixed w-100 h-100"
            >
                <div
                    className="preferences-modal-content border-radius-6 
            background-chat text-primary-color"
                >
                    <div className="m-0 w-100 h-100">
                        <div className="m-0 p-0 preferences-aside-content border-radius-6">
                            <div className="d-flex">
                                {preferencesOptions.map((item, index) => {
                                    return (
                                        item.isEnabled && (
                                            <div
                                                className={'target d-flex preferences-item '.concat(
                                                    ' ',
                                                    preferencesOptionSelected &&
                                                        preferencesOptionSelected.name ===
                                                            item.name
                                                        ? 'normal-btn-hover'
                                                        : '',
                                                )}
                                                key={index}
                                                onClick={() =>
                                                    updatePreferenceSelected(
                                                        item.ticker,
                                                    )
                                                }
                                            >
                                                {item.icon}
                                            </div>
                                        )
                                    );
                                })}
                            </div>

                            <img
                                className="close-modal-icon m-2"
                                src={closeIcon}
                                alt="close"
                                onClick={() => {
                                    resetConfigureProfileModal();
                                    setShowPreferencesModal(false);
                                    closeConfigurationModal(
                                        setShowProfileConfigurationModal,
                                    );
                                }}
                            />
                        </div>

                        <div className="m-0 p-0 preferences-component">
                            {preferencesOptionSelected &&
                                preferencesOptionSelected.isEnabled &&
                                preferencesOptionSelected.component}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
