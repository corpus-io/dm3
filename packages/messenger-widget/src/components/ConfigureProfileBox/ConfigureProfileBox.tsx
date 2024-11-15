import './ConfigureProfileBox.css';
import { useContext, useEffect, useState } from 'react';
import { openConfigurationModal } from '../ConfigureProfile/bl';
import { AuthContext } from '../../context/AuthContext';
import { ConversationContext } from '../../context/ConversationContext';
import { ModalContext } from '../../context/ModalContext';
import { DM3ConfigurationContext } from '../../context/DM3ConfigurationContext';

export default function ConfigureProfileBox() {
    const { displayName } = useContext(AuthContext);
    const { selectedContact } = useContext(ConversationContext);
    const { dm3Configuration } = useContext(DM3ConfigurationContext);
    const {
        setShowProfileConfigurationModal,
        setShowPreferencesModal,
        isProfileDialogDisabled,
        updatePreferenceSelected,
    } = useContext(ModalContext);

    const [showConfigBox, setShowConfigBox] = useState<boolean>(false);

    // fetches sub domain of ENS
    const isAddrEnsName = displayName?.endsWith(
        dm3Configuration.addressEnsSubdomain,
    );

    // handles profile configuration changes
    useEffect(() => {
        setShowConfigBox(!displayName || isAddrEnsName ? true : false);
    }, [displayName]);

    return showConfigBox && !isProfileDialogDisabled() ? (
        <div
            data-testid="config-profile-box"
            className={'config-box-main width-fill background-container'.concat(
                ' ',
                selectedContact
                    ? 'highlight-right-border'
                    : 'highlight-right-border-none',
            )}
        >
            <div
                className="box-outer-container border-radius-4 profile-configuration-box
            profile-configuration-box-border"
            >
                <div className="text-center d-flex justify-content-center configure-msg-box">
                    You have not yet configured your profile.
                </div>
                <div className="d-flex justify-content-center config-btn-container">
                    <button
                        data-testid="config-prof-btn"
                        className="border-radius-6 background-config-box text-primary-color 
                        profile-configuration-box-border"
                        onClick={() =>
                            openConfigurationModal(
                                setShowProfileConfigurationModal,
                                setShowPreferencesModal,
                                updatePreferenceSelected,
                            )
                        }
                    >
                        Configure Profile
                    </button>
                </div>
            </div>
        </div>
    ) : (
        <></>
    );
}
