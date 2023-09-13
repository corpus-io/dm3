import './Menu.css';
import { useContext } from 'react';
import closeIcon from '../../assets/images/cross.svg';
import addIcon from '../../assets/images/add.svg';
import settingsIcon from '../../assets/images/settings.svg';
import {
    LeftViewSelected,
    ModalStateType,
    UiViewStateType,
} from '../../utils/enum-type-utils';
import { GlobalContext } from '../../utils/context-utils';
import { startLoader } from '../Loader/Loader';
import { openConversationModal } from '../AddConversation/bl';
import { openPreferencesModal } from '../Preferences/bl';

export default function Menu() {
    // fetches context api data
    const { dispatch } = useContext(GlobalContext);

    const showContactList = () => {
        dispatch({
            type: ModalStateType.LoaderContent,
            payload: 'Fetching contacts...',
        });
        startLoader();
        dispatch({
            type: UiViewStateType.SetSelectedLeftView,
            payload: LeftViewSelected.Contacts,
        });
    };

    return (
        <div className="menu-container height-fill width-fill">
            <div className="menu-item-cancel d-flex justify-content-end">
                <img
                    src={closeIcon}
                    alt="close"
                    className="pointer-cursor close-icon"
                    onClick={() => showContactList()}
                />
            </div>
            <div
                className="d-flex align-items-center justify-content-start pointer-cursor 
            menu-items font-weight-400 text-primary-color"
                onClick={() => openConversationModal()}
            >
                <img
                    src={addIcon}
                    alt="close"
                    className="pointer-cursor menu-item-icon"
                />
                Add Conversation
            </div>
            <div
                className="d-flex align-items-center justify-content-start pointer-cursor 
            menu-items font-weight-400 text-primary-color"
                onClick={() => openPreferencesModal()}
            >
                <img
                    src={settingsIcon}
                    alt="close"
                    className="pointer-cursor menu-item-icon"
                />
                Preferences
            </div>

            <div className="version-container width-fill p-3 font-size-14">
                <hr className="line-separator text-secondary-color" />
                <div className="font-weight-800 text-secondary-color">dm3</div>
                <div className="text-secondary-color">Version 1.1</div>
                <div className="text-secondary-color">https://dm3.network</div>
            </div>
        </div>
    );
}
