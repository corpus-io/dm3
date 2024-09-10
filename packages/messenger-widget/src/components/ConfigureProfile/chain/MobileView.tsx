import { useContext } from 'react';
import { ConfigureProfileContext } from '../context/ConfigureProfileContext';
import {
    ACTION_TYPE,
    NAME_TYPE,
    PROFILE_INPUT_FIELD_CLASS,
    BUTTON_CLASS,
} from './common';

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
    } = useContext(ConfigureProfileContext);

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
            {/* ENS Name */}
            <div className="d-flex ps-2">
                <div className="dm3-name-container">
                    <div className="d-flex flex-column">
                        <p className="m-0 font-size-14 font-weight-500 line-height-24 title-content">
                            {propertyName}
                        </p>
                        <div
                            className={
                                'conversation-error font-weight-400 ms-3 show-error'
                            }
                        >
                            {showError === NAME_TYPE.ENS_NAME && errorMsg}
                        </div>
                        {!existingEnsName ? (
                            <form
                                className="pe-2"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handlePublishOrRemoveProfile(
                                        existingEnsName
                                            ? ACTION_TYPE.REMOVE
                                            : ACTION_TYPE.CONFIGURE,
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
                        ) : (
                            <p className="m-0 font-size-14 font-weight-500 line-height-24 grey-text">
                                {existingEnsName}
                            </p>
                        )}
                        <div className="mt-2">
                            {!existingEnsName && (
                                <button
                                    data-testid="publish-profile"
                                    disabled={
                                        !existingEnsName &&
                                        (!ensName || !ensName.length)
                                    }
                                    className={BUTTON_CLASS.concat(
                                        ' ',
                                        !existingEnsName &&
                                            (!ensName || !ensName.length)
                                            ? 'modal-btn-disabled'
                                            : 'modal-btn-active',
                                    )}
                                    onClick={() =>
                                        handlePublishOrRemoveProfile(
                                            existingEnsName
                                                ? ACTION_TYPE.REMOVE
                                                : ACTION_TYPE.CONFIGURE,
                                        )
                                    }
                                >
                                    {!existingEnsName
                                        ? ' Publish Profile'
                                        : 'Rename Profile'}
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="mt-3 dm3-name-content">
                        <div className="small-text font-weight-300 grey-text">
                            {label}
                        </div>
                        <div className="small-text font-weight-700">{note}</div>
                    </div>
                </div>
            </div>
        </>
    );
};
