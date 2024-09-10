import { useContext } from 'react';
import detailsIcon from '../../assets/images/details.svg';
import hideIcon from '../../assets/images/hide.svg';
import { IContactMenu } from '../../interfaces/props';
import { RightViewSelected } from '../../utils/enum-type-utils';
import { ConversationContext } from '../../context/ConversationContext';
import { closeContactMenu } from '../../utils/common-utils';
import { DM3ConfigurationContext } from '../../context/DM3ConfigurationContext';
import { UiViewContext } from '../../context/UiViewContext';

export function ContactMenu(props: IContactMenu) {
    const { hideContact } = useContext(ConversationContext);
    const { dm3Configuration } = useContext(DM3ConfigurationContext);
    const { setSelectedRightView } = useContext(UiViewContext);

    const onClickOfShowDetails = () => {
        setSelectedRightView(RightViewSelected.ContactInfo);
        closeContactMenu();
    };

    const onClickOfHideContact = () => {
        hideContact(props.contactDetails.contactDetails.account.ensName);
        //Close the message Modal and show the default one instead
        setSelectedRightView(RightViewSelected.Default);
        closeContactMenu();
    };

    return (
        <div
            className={'dropdown-content font-size-14 font-weight-400'.concat(
                ' ',
                props.isMenuAlignedAtBottom ? '' : 'dropdown-content-top-align',
            )}
        >
            <div
                className="d-flex align-items-center justify-content-start"
                onClick={() => onClickOfShowDetails()}
            >
                <img src={detailsIcon} alt="details" className="me-2" />
                Show Details
            </div>

            {/* 
                Hide button is not visible when showContacts is false.
                User has no option to choose contact means single contact is
                available for chat, so that can't be hided 
            */}
            {dm3Configuration.showContacts && (
                <div
                    className="d-flex align-items-center justify-content-start"
                    onClick={() => onClickOfHideContact()}
                >
                    <img src={hideIcon} alt="hide" className="me-2" />
                    Hide Contact
                </div>
            )}
        </div>
    );
}
