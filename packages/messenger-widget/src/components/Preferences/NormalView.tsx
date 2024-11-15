import './Preferences.css';
import infoIcon from './../../assets/images/preferences-info.svg';
import { useContext, useEffect } from 'react';
import closeIcon from '../../assets/images/cross.svg';
import { closeConfigurationModal } from '../ConfigureProfile/bl';
import { ModalContext } from '../../context/ModalContext';

export function NormalView() {
    const {
        setShowPreferencesModal,
        showProfileConfigurationModal,
        setShowProfileConfigurationModal,
        resetConfigureProfileModal,
        preferencesOptionSelected,
        updatePreferenceSelected,
        preferencesOptions,
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
                    <div className="row m-0 h-100 w-100">
                        <div className="col-2 m-0 p-0 preferences-aside-content border-radius-6">
                            <div
                                className={
                                    'pt-3 d-flex align-items-center justify-content-center'
                                }
                            >
                                <span
                                    className={'preferences-heading d-flex justify-content-center mb-0'.concat(
                                        ' ',
                                        preferencesOptionSelected
                                            ? 'preferences-text-highlighted'
                                            : 'text-primary-color',
                                    )}
                                >
                                    Preferences
                                </span>
                            </div>

                            <hr className="preferences-separator" />
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
                                            {item.name}
                                        </div>
                                    )
                                );
                            })}

                            <div className="d-flex text-primary-color preferences-info">
                                <span className="d-flex pointer-cursor preferences-item info-no-highlight">
                                    <img
                                        src={infoIcon}
                                        alt="info"
                                        className="me-2 pref-icon"
                                    />
                                    Information
                                </span>
                            </div>
                        </div>
                        <div className="col-10 m-0 p-0">
                            {preferencesOptionSelected &&
                            preferencesOptionSelected.isEnabled ? (
                                preferencesOptionSelected.component
                            ) : (
                                <div className="d-flex align-items-start justify-content-end">
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
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
