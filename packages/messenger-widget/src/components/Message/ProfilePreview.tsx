import { useContext } from 'react';
import './Message.css';
import { UiViewContext } from '../../context/UiViewContext';
import { RightViewSelected } from '../../utils/enum-type-utils';
import { closeContactMenu } from '../../utils/common-utils';
import { ConversationContext } from '../../context/ConversationContext';

export interface ProfilePreviewProps {
    picture: string;
    ownMessage: boolean;
}

export function ProfilePreview(props: ProfilePreviewProps) {
    const { setSelectedRightView } = useContext(UiViewContext);
    const { setSelectedContactName } = useContext(ConversationContext);

    // method to open the profile of selected account
    const openProfile = () => {
        // if our own profile icon is clicked
        if (props.ownMessage) {
            // select and open profile component
            setSelectedRightView(RightViewSelected.Profile);
            // unselect the contact
            setSelectedContactName(undefined);
            return;
        }
        // open contact info of the selected contact
        setSelectedRightView(RightViewSelected.ContactInfo);
        // close the contact menu
        closeContactMenu();
    };

    return (
        <div className="d-flex me-2">
            {/* profile picture of the account or contact selected */}
            <img
                className="chat-profile-pic mb-1 pointer-cursor"
                src={props.picture}
                onClick={() => openProfile()}
            />
        </div>
    );
}
