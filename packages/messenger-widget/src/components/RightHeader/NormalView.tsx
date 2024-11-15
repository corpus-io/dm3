import './RightHeader.css';
import { useContext } from 'react';
import humanIcon from '../../assets/images/human.svg';
import menuIcon from '../../assets/images/menu.svg';
import { AuthContext } from '../../context/AuthContext';
import { RightViewSelected } from '../../utils/enum-type-utils';
import { ConversationContext } from '../../context/ConversationContext';
import { DM3ConfigurationContext } from '../../context/DM3ConfigurationContext';
import { UiViewContext } from '../../context/UiViewContext';
import { DM3UserProfileContext } from '../../context/DM3UserProfileContext';

export function NormalView() {
    const { displayName } = useContext(AuthContext);

    const { setSelectedContactName } = useContext(ConversationContext);

    const { dm3Configuration } = useContext(DM3ConfigurationContext);

    const { setSelectedRightView, selectedRightView } =
        useContext(UiViewContext);

    const { accountProfilePicture } = useContext(DM3UserProfileContext);

    // method to set profile page and set contact
    const updateView = () => {
        setSelectedRightView(RightViewSelected.Profile);
        setSelectedContactName(undefined);
    };

    return (
        <div
            className={(dm3Configuration.showContacts
                ? 'justify-content-end'
                : 'justify-content-between'
            ).concat(
                ' col-12 d-flex align-items-center pr-0 profile-name-container'.concat(
                    ' ',
                    selectedRightView === RightViewSelected.Profile
                        ? ' background-chat'
                        : ' background-container',
                ),
            )}
        >
            {!dm3Configuration.showContacts && (
                <div
                    className={
                        !dm3Configuration.showContacts
                            ? 'p-2'
                            : 'menu-icon-container'
                    }
                >
                    <img src={menuIcon} className="pointer-cursor" alt="menu" />
                </div>
            )}

            <div className="d-flex align-items-center justify-content-end">
                <span
                    data-testid="display-name-id"
                    onClick={() => updateView()}
                    className="profile-name font-weight-500 pointer-cursor text-secondary-color"
                >
                    {displayName}
                </span>
                <img
                    src={
                        accountProfilePicture
                            ? accountProfilePicture
                            : humanIcon
                    }
                    alt="menu"
                    className="me-2 pointer-cursor border-radius-3 default-profile-pic"
                    onClick={() => updateView()}
                />
            </div>
        </div>
    );
}
