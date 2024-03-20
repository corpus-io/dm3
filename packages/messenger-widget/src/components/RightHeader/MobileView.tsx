import './RightHeader.css';
import { useContext, useEffect, useState } from 'react';
import humanIcon from '../../assets/images/human.svg';
import backIcon from '../../assets/images/back.svg';
import threeDotsIcon from '../../assets/images/three-dots.svg';
import { useMainnetProvider } from '../../hooks/mainnetprovider/useMainnetProvider';
import { HideFunctionProps } from '../../interfaces/props';
import { GlobalContext } from '../../utils/context-utils';
import { getAvatarProfilePic } from '../../utils/ens-utils';
import { RightViewSelected } from '../../utils/enum-type-utils';
import { ConversationContext } from '../../context/ConversationContext';
import { closeContactMenu } from '../../utils/common-utils';
import { ContactMenu } from '../ContactMenu/ContactMenu';
import { ContactPreview } from '../../interfaces/utils';

export function MobileView(props: HideFunctionProps) {
    // fetches context storage
    const { state } = useContext(GlobalContext);
    const { setSelectedContactName, selectedContact } =
        useContext(ConversationContext);

    const mainnetProvider = useMainnetProvider();

    // state to store profile pic of signed in user
    const [profilePic, setProfilePic] = useState<string>('');

    const contactName = selectedContact?.contactDetails.account.ensName;

    // fetches profile pic of contact selected
    const fetchAndSetProfilePic = async () => {
        setProfilePic(
            await getAvatarProfilePic(mainnetProvider, contactName as string),
        );
    };

    // Method to open 3 dot icon menu to in mobile screen
    const openMenu = () => {
        const menu = document.querySelector('.dropdown-content');
        if (menu && !menu.classList.contains('menu-details-dropdown-content')) {
            menu.classList.add('menu-details-dropdown-content');
        } else {
            closeContactMenu();
        }
    };

    // loads the profile pic on page render
    useEffect(() => {
        fetchAndSetProfilePic();
    }, []);

    return (
        <>
            {state.uiView.selectedRightView === RightViewSelected.Chat && (
                <div
                    className={'justify-content-between'.concat(
                        ' col-12 d-flex align-items-center pr-0 profile-name-container background-container',
                    )}
                >
                    <div className="d-flex justify-content-between align-items-center">
                        {props.showContacts && (
                            <img
                                src={backIcon}
                                alt="pic"
                                className="me-2 pointer-cursor border-radius-3 back-btn"
                                onClick={() => {
                                    setSelectedContactName(undefined);
                                }}
                            />
                        )}

                        <img
                            src={profilePic ? profilePic : humanIcon}
                            alt="pic"
                            className="me-2 pointer-cursor border-radius-3 default-profile-pic"
                        />

                        <span className="font-size-10 text-primary-color">
                            {contactName}
                        </span>
                    </div>

                    <div>
                        <img
                            className="menu-details"
                            src={threeDotsIcon}
                            alt="menu"
                            onClick={() => openMenu()}
                        />
                        {
                            <ContactMenu
                                contactDetails={
                                    selectedContact as ContactPreview
                                }
                                isMenuAlignedAtBottom={true}
                            />
                        }
                    </div>
                </div>
            )}
        </>
    );
}
