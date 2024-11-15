import '../../styles/modal.css';
import './ConfigureProfile.css';
import { useContext, useEffect } from 'react';
import { useChainId } from 'wagmi';
import { AuthContext } from '../../context/AuthContext';
import { useMainnetProvider } from '../../hooks/mainnetprovider/useMainnetProvider';
import { BUTTON_CLASS, fetchServiceFromChainId, getEnsName } from './bl';
import { ConfigureProfileContext } from './context/ConfigureProfileContext';
import { DM3ConfigurationContext } from '../../context/DM3ConfigurationContext';
import { ModalContext } from '../../context/ModalContext';
import { ProfileScreenType, ProfileType } from '../../utils/enum-type-utils';
import { ProfileTypeSelector } from './ProfileTypeSelector';
import { ClaimDM3Name } from './ClaimDM3Name';
import { ConfigureDM3NameContext } from './context/ConfigureDM3NameContext';
import DeleteDM3Name from '../DeleteDM3Name/DeleteDM3Name';
import deleteIcon from '../../assets/images/delete.svg';
import { CloudStorage } from './CloudStorage';
import { OwnStorage } from './OwnStorage';
import { ClaimOwnName } from './ClaimOwnName';
import { DM3UserProfileContext } from '../../context/DM3UserProfileContext';
import updateIcon from '../../assets/images/update.svg';

export function MobileView() {
    const connectedChainId = useChainId();

    const mainnetProvider = useMainnetProvider();

    const { account, ethAddress } = useContext(AuthContext);

    const { configureProfileModal, setConfigureProfileModal, disabledOptions } =
        useContext(ModalContext);

    const { setEnsName, setNamingServiceSelected, existingEnsName } =
        useContext(ConfigureProfileContext);

    const {
        existingDm3Name,
        setShowDeleteConfirmation,
        showDeleteConfirmation,
        updateDeleteConfirmation,
        handleClaimOrRemoveDm3Name,
    } = useContext(ConfigureDM3NameContext);

    const { dm3Configuration } = useContext(DM3ConfigurationContext);

    const {
        updateProfileForAddressName,
        updateProfileWithTransaction,
        isProfileUpdatedForAddrName,
        isProfileUpdatedForDm3Name,
        isProfileUpdatedForEnsName,
    } = useContext(DM3UserProfileContext);

    const ensDomainName =
        (existingEnsName &&
            (existingEnsName?.endsWith('.gno') ||
            existingEnsName?.endsWith('.gnosis.eth')
                ? 'GNO'
                : 'ENS')) ??
        null;

    // handles ENS name and address
    useEffect(() => {
        getEnsName(
            mainnetProvider,
            ethAddress!,
            account!,
            (name: string) => setEnsName(name),
            dm3Configuration.addressEnsSubdomain,
        );
    }, [ethAddress]);

    useEffect(() => {
        // set the naming service selected by default based on chain connected if no options are disabled
        if (
            connectedChainId &&
            !disabledOptions.profile.own.filter((p) => p.value).length
        ) {
            setNamingServiceSelected(fetchServiceFromChainId(connectedChainId));
        }
    }, []);

    return (
        <div className="pb-3">
            {/* Delete DM3 name confirmation popup modal */}
            {showDeleteConfirmation && (
                <DeleteDM3Name
                    setDeleteDM3NameConfirmation={updateDeleteConfirmation}
                    removeDm3Name={handleClaimOrRemoveDm3Name}
                />
            )}

            <div className="profile-config-container ps-2 mt-3">
                {/* Wallet address */}
                <div className="d-flex">
                    <p
                        className={'m-0 font-size-14 font-weight-500 line-height-24 title-content'.concat(
                            ' ',
                            !isProfileUpdatedForAddrName ? 'error-text' : '',
                        )}
                    >
                        Wallet Address
                        <span className="address-tooltip">
                            i
                            <span className="address-tooltip-text">
                                You can use your wallet address as a username. A
                                virtual profile is created and stored at a dm3
                                service. There are no transaction costs for
                                creation and administration.
                                <br />
                                <span className="font-weight-800">
                                    {' '}
                                    You can receive messages sent to your wallet
                                    address.
                                </span>
                            </span>
                        </span>
                    </p>
                </div>
                <p
                    className={'dm3-address m-0 font-size-14 font-weight-500 line-height-24'.concat(
                        ' ',
                        !isProfileUpdatedForAddrName
                            ? 'error-text'
                            : 'grey-text',
                    )}
                >
                    {ethAddress &&
                        ethAddress + dm3Configuration.addressEnsSubdomain}
                </p>
                {!isProfileUpdatedForAddrName && (
                    <button
                        className="add-prof-btn-active update-btn"
                        onClick={() => updateProfileForAddressName()}
                    >
                        <img
                            className="me-1 pointer-cursor "
                            src={updateIcon}
                            alt="update profile"
                        />
                        update now
                    </button>
                )}
            </div>

            {/* Existing DM3 name */}
            {existingDm3Name && (
                <div className="d-flex mt-2 ps-2 flex-column">
                    <p
                        className={'m-0 font-size-14 font-weight-500 line-height-24 title-content'.concat(
                            ' ',
                            !isProfileUpdatedForDm3Name ? 'error-text' : '',
                        )}
                    >
                        DM3 Name
                        <span className="address-tooltip">
                            i
                            <span className="address-tooltip-text">
                                DM3 name is used as a username and can be used
                                by any address to send the messages to this DM3
                                name.
                                <br />
                                <span className="font-weight-800">
                                    {' '}
                                    You can receive messages sent to your DM3
                                    name.
                                </span>
                            </span>
                        </span>
                    </p>
                    <p
                        className={'dm3-address m-0 ms-0 font-size-14 font-weight-500 line-height-24 grey-text'.concat(
                            ' ',
                            !isProfileUpdatedForDm3Name
                                ? 'error-text'
                                : 'grey-text',
                        )}
                    >
                        {existingDm3Name}

                        {/* Delete icon */}
                        <img
                            className="ms-4 pointer-cursor del-icon"
                            src={deleteIcon}
                            alt="remove"
                            onClick={() => setShowDeleteConfirmation(true)}
                        />
                    </p>

                    {!isProfileUpdatedForDm3Name && (
                        <button
                            className="add-prof-btn-active update-btn"
                            onClick={() => {
                                if (existingDm3Name.endsWith('.op.dm3.eth')) {
                                    updateProfileWithTransaction(
                                        existingEnsName
                                            ? existingEnsName
                                            : existingDm3Name,
                                    );
                                } else {
                                    updateProfileForAddressName();
                                }
                            }}
                        >
                            <img
                                className="me-1 pointer-cursor "
                                src={updateIcon}
                                alt="update profile"
                                onClick={() => {}}
                            />
                            update now
                        </button>
                    )}
                </div>
            )}

            {/* Existing ENS name */}
            {ensDomainName && existingEnsName && (
                <div className="d-flex mt-2 ps-2">
                    <p
                        className={'m-0 font-size-14 font-weight-500 line-height-24 title-content'.concat(
                            ' ',
                            !isProfileUpdatedForEnsName ? 'error-text' : '',
                        )}
                    >
                        {ensDomainName} Name
                        <span className="address-tooltip">
                            i
                            <span className="address-tooltip-text">
                                {ensDomainName} name is used as a username and
                                can be used by any address to send the messages
                                to this {ensDomainName}
                                name.
                                <br />
                                <span className="font-weight-800">
                                    {' '}
                                    You can receive messages sent to your{' '}
                                    {ensDomainName}
                                    name.
                                </span>
                            </span>
                        </span>
                    </p>
                    <p
                        className={'dm3-address m-0 ms-0 font-size-14 font-weight-500 line-height-24'.concat(
                            ' ',
                            !isProfileUpdatedForEnsName
                                ? 'error-text'
                                : 'grey-text',
                        )}
                    >
                        {existingEnsName}
                    </p>

                    {!isProfileUpdatedForEnsName && (
                        <button
                            className="add-prof-btn-active update-btn"
                            onClick={() =>
                                updateProfileWithTransaction(existingEnsName)
                            }
                        >
                            <img
                                className="me-1 pointer-cursor "
                                src={updateIcon}
                                alt="update profile"
                                onClick={() => {}}
                            />
                            update now
                        </button>
                    )}
                </div>
            )}

            {/* Add profile button */}
            <div className="mt-4 ms-2">
                <button
                    className={BUTTON_CLASS.concat(
                        configureProfileModal.onScreen ===
                            ProfileScreenType.NONE
                            ? ' add-prof-btn-active'
                            : ' add-prof-btn-disabled',
                    )}
                    disabled={
                        configureProfileModal.onScreen !==
                        ProfileScreenType.NONE
                    }
                    onClick={() => {
                        setConfigureProfileModal({
                            ...configureProfileModal,
                            onScreen: ProfileScreenType.SELECT_TYPE,
                        });
                    }}
                >
                    Add Profile ...
                </button>
            </div>

            {/* Screen to select profile type */}
            {configureProfileModal.onScreen ===
                ProfileScreenType.SELECT_TYPE && <ProfileTypeSelector />}

            {/* Screen to select storage type */}
            {configureProfileModal.onScreen ===
                ProfileScreenType.SELECT_STORAGE && (
                <div className="mt-4 ms-4 me-4 dm3-prof-select-container">
                    {configureProfileModal.profileOptionSelected ===
                    ProfileType.DM3_NAME ? (
                        <CloudStorage />
                    ) : (
                        <OwnStorage />
                    )}
                </div>
            )}

            {/* Screen to claim profile name */}
            {configureProfileModal.onScreen === ProfileScreenType.CLAIM_NAME &&
                (configureProfileModal.profileOptionSelected ===
                ProfileType.DM3_NAME ? (
                    <ClaimDM3Name />
                ) : (
                    <ClaimOwnName />
                ))}
        </div>
    );
}
