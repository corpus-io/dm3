import './../ConfigureProfile.css';
import { useContext } from 'react';
import { AuthContext } from '../../../context/AuthContext';
import { ConfigureProfileContext } from '../context/ConfigureProfileContext';
import { ConfigureDM3NameContext } from '../context/ConfigureDM3NameContext';
import {
    ACTION_TYPE,
    BUTTON_CLASS,
    NAME_TYPE,
    PROFILE_INPUT_FIELD_CLASS,
} from '../chain/common';
import { ProfileScreenType, ProfileType } from '../../../utils/enum-type-utils';
import { ModalContext } from '../../../context/ModalContext';

export const NormalView = ({
    nameExtension,
    placeholder,
    submitDm3UsernameClaim,
}: {
    nameExtension: string;
    placeholder: string;
    submitDm3UsernameClaim: (dm3UserEnsName: string) => void;
}) => {
    const { setDisplayName } = useContext(AuthContext);

    const { errorMsg, showError, onShowError, setEnsName } = useContext(
        ConfigureProfileContext,
    );

    const {
        dm3Name,
        handleNameChange,
        handleClaimOrRemoveDm3Name,
        setDm3Name,
    } = useContext(ConfigureDM3NameContext);

    const { configureProfileModal, setConfigureProfileModal } =
        useContext(ModalContext);

    return (
        <>
            <div className="d-flex ps-4 align-items-baseline">
                <div className="dm3-name-container">
                    <div className="d-flex align-items-center">
                        <p
                            className="m-0 
                    font-size-14 font-weight-500 line-height-24 title-content invisible"
                        >
                            DM3 Name
                        </p>
                        <div
                            className={
                                'conversation-error ms-0 mb-2 font-weight-400 show-error'
                            }
                        >
                            {showError === NAME_TYPE.DM3_NAME && errorMsg}
                        </div>
                    </div>
                    <div className="d-flex align-items-center">
                        <p
                            className="m-0 
                    font-size-14 font-weight-500 line-height-24 title-content"
                        >
                            DM3 Name
                        </p>
                        <form
                            className="d-flex width-fill align-items-center"
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleClaimOrRemoveDm3Name(
                                    ACTION_TYPE.CONFIGURE,
                                    setDisplayName,
                                    submitDm3UsernameClaim,
                                );
                            }}
                        >
                            <input
                                data-testid="dm3-name"
                                className={PROFILE_INPUT_FIELD_CLASS.concat(
                                    ' ',
                                    showError === NAME_TYPE.DM3_NAME
                                        ? 'w-80 err-background'
                                        : 'w-80 ',
                                )}
                                type="text"
                                value={dm3Name}
                                placeholder={placeholder}
                                onChange={(
                                    e: React.ChangeEvent<HTMLInputElement>,
                                ) => handleNameChange(e, NAME_TYPE.DM3_NAME)}
                            />
                            <p
                                className="mb-0 ms-1 font-size-14 font-weight-500 
                line-height-24 grey-text"
                            >
                                {nameExtension}
                            </p>
                        </form>
                    </div>

                    <div className="mt-4 pt-2 dm3-name-content">
                        <div className="small-text font-weight-300">
                            You can get a DM3 name for free. Please check if
                            your desired name is available. DM3 names are
                            created and managed on Layer2 (e.g. Optimism). Small
                            transaction costs will apply for setting the profile
                            and administration.
                        </div>
                        <div className="small-text font-weight-700">
                            You can receive messages sent to your full DM3
                            username.
                        </div>
                    </div>
                </div>
            </div>

            <div className="profile-action-btns d-flex justify-content-end me-3 mb-3">
                <button
                    className={BUTTON_CLASS.concat(
                        ' ',
                        'config-profile-cancel-btn me-3',
                    )}
                    onClick={() => {
                        setDm3Name('');
                        setEnsName('');
                        onShowError(NAME_TYPE.DM3_NAME, '');
                        setConfigureProfileModal({
                            profileOptionSelected: ProfileType.DM3_NAME,
                            onScreen: ProfileScreenType.NONE,
                        });
                    }}
                >
                    Cancel
                </button>
                <button
                    data-testid="claim-publish"
                    disabled={!dm3Name || !dm3Name.length}
                    className={BUTTON_CLASS.concat(
                        ' ',
                        !dm3Name || !dm3Name.length
                            ? 'add-prof-btn-disabled'
                            : 'add-prof-btn-active',
                    )}
                    onClick={() =>
                        handleClaimOrRemoveDm3Name(
                            ACTION_TYPE.CONFIGURE,
                            setDisplayName,
                            submitDm3UsernameClaim,
                        )
                    }
                >
                    Claim and publish
                </button>
            </div>
        </>
    );
};
