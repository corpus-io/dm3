import './SendMessage.css';
import { useContext, useState } from 'react';
import sendBtnIcon from '../../assets/images/send-btn.svg';
import { AuthContext } from '../../context/AuthContext';
import { ConversationContext } from '../../context/ConversationContext';
import { MessageContext } from '../../context/MessageContext';
import { MessageDataProps } from '../../interfaces/props';
import { onSubmitMessage } from './onSubmitMessage';
import { UiViewContext } from '../../context/UiViewContext';
import { ModalContext } from '../../context/ModalContext';

export function SendMessage(props: MessageDataProps) {
    const { account, profileKeys } = useContext(AuthContext);
    const { addMessage } = useContext(MessageContext);
    const { selectedContact } = useContext(ConversationContext);
    const { messageView, setMessageView } = useContext(UiViewContext);
    const { setLastMessageAction } = useContext(ModalContext);
    const [isSendBtnDisabled, setIsSendBtnDisabled] = useState<boolean>(false);

    async function submit() {
        if (isSendBtnDisabled) {
            return;
        }
        setIsSendBtnDisabled(true);
        await onSubmitMessage(
            messageView,
            setMessageView,
            setLastMessageAction,
            addMessage,
            props,
            profileKeys,
            account!,
            selectedContact!,
        );
        setIsSendBtnDisabled(false);
    }

    return (
        <span className="msg-send-btn align-items-center pointer-cursor text-secondary-color">
            <img
                className="chat-svg-icon"
                src={sendBtnIcon}
                alt="send"
                onClick={submit}
            />
        </span>
    );
}
