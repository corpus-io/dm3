import { useContext } from 'react';
import { ConfigureProfileContext } from '../context/ConfigureProfileContext';
import {
    ACTION_TYPE,
    NAME_TYPE,
    PROFILE_INPUT_FIELD_CLASS,
    BUTTON_CLASS,
} from './common';
import { ModalContext } from '../../../context/ModalContext';
import { ConfigureDM3NameContext } from '../context/ConfigureDM3NameContext';
import { ProfileScreenType, ProfileType } from '../../../utils/enum-type-utils';

export const MobileView = ({
    propertyName,
    label,
    note,
    placeholder,
    onSubmitTx,
    handleNameChange,
}: {
    propertyName: string;
    label: string;
    note: string;
    placeholder: string;
    onSubmitTx: (name: string) => void;
    handleNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
    const {
        showError,
        ensName,
        onShowError,
        errorMsg,
        existingEnsName,
        setExistingEnsName,
        setEnsName,
    } = useContext(ConfigureProfileContext);

    const { setDm3Name } = useContext(ConfigureDM3NameContext);

    const { configureProfileModal, setConfigureProfileModal } =
        useContext(ModalContext);

    // handles configure or remove ENS name
    const handlePublishOrRemoveProfile = async (type: ACTION_TYPE) => {
        if (type === ACTION_TYPE.CONFIGURE) {
            const name = ensName.trim();
            if (!name.length) {
                onShowError(NAME_TYPE.ENS_NAME, 'ENS name cannot be empty');
                return;
            }
            onSubmitTx(name);
        } else {
            setExistingEnsName(null);
        }
    };
    return (
        <>
            <div className="d-flex ps-2 align-items-baseline">
                <div className="dm3-name-container">
                    <div className="d-flex flex-column">
                        <p
                            className="m-0 
                    font-size-14 font-weight-500 line-height-24 title-content"
                        >
                            {propertyName}
                        </p>
                        <div
                            className={
                                'conversation-error font-weight-400 ms-3 show-error'
                            }
                        >
                            {showError === NAME_TYPE.ENS_NAME && errorMsg}
                        </div>

                        <form
                            className="pe-2"
                            onSubmit={(e) => {
                                e.preventDefault();
                                handlePublishOrRemoveProfile(
                                    ACTION_TYPE.CONFIGURE,
                                );
                            }}
                        >
                            <input
                                data-testid="ens-name"
                                className={PROFILE_INPUT_FIELD_CLASS.concat(
                                    ' ',
                                    showError === NAME_TYPE.ENS_NAME
                                        ? 'err-background'
                                        : '',
                                )}
                                type="text"
                                value={ensName}
                                placeholder={placeholder}
                                onChange={(
                                    e: React.ChangeEvent<HTMLInputElement>,
                                ) => handleNameChange(e)}
                            />
                        </form>
                    </div>

                    <div className="mt-3 dm3-name-content">
                        <div className="small-text font-weight-300 grey-text">
                            {label}
                        </div>
                        <div className="small-text font-weight-700">{note}</div>
                    </div>

                    <div className="mt-3 mb-2">
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
                            data-testid="publish-profile"
                            disabled={!ensName || !ensName.length}
                            className={BUTTON_CLASS.concat(
                                ' ',
                                !ensName || !ensName.length
                                    ? 'add-prof-btn-disabled'
                                    : 'add-prof-btn-active',
                            )}
                            onClick={() =>
                                handlePublishOrRemoveProfile(
                                    ACTION_TYPE.CONFIGURE,
                                )
                            }
                        >
                            Publish Profile
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};
