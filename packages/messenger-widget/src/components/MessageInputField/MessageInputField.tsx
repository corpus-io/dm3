import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { ConversationContext } from '../../context/ConversationContext';
import { MessageContext } from '../../context/MessageContext';
import { MessageDataProps } from '../../interfaces/props';
import { MessageActionType } from '../../utils/enum-type-utils';
import { onSubmitMessage } from '../SendMessage/onSubmitMessage';
import { UiViewContext } from '../../context/UiViewContext';
import { ModalContext } from '../../context/ModalContext';

export function MessageInputField(props: MessageDataProps) {
    const { account, profileKeys } = useContext(AuthContext);
    const { selectedContact } = useContext(ConversationContext);
    const { addMessage } = useContext(MessageContext);
    const { setMessageView, messageView } = useContext(UiViewContext);
    const { setLastMessageAction } = useContext(ModalContext);
    const [isSendBtnDisabled, setIsSendBtnDisabled] = useState<boolean>(false);

    const resetMessageView = {
        actionType: MessageActionType.NONE,
        messageData: undefined,
    };

    function setMessageContent(e: React.ChangeEvent<HTMLInputElement>) {
        // if message action is edit and message length is 0, update message action
        if (!e.target.value.length) {
            setMessageView(resetMessageView);
            props.setFiles([]);
        }
        props.setMessageText(e.target.value);
    }

    async function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
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

    // Focus on input field when user selects a msg to EEDIT or REPLY
    useEffect(() => {
        if (
            messageView.actionType === MessageActionType.EDIT ||
            messageView.actionType === MessageActionType.REPLY
        ) {
            const inputField = document.getElementById(
                'msg-input',
            ) as HTMLElement;
            if (inputField) {
                inputField.focus();
            }
        }
    }, [messageView.actionType]);

    // Closes EDIT MSG if ESC button is clicked
    document.body.addEventListener('keydown', function (e) {
        if (
            e.key === 'Escape' &&
            messageView.actionType === MessageActionType.EDIT
        ) {
            setMessageView(resetMessageView);
            props.setFiles([]);
            props.setMessageText('');
        }
    });

    return (
        <form
            className="width-fill ms-2 d-flex"
            onSubmit={(event: React.FormEvent<HTMLFormElement>) =>
                submit(event)
            }
        >
            <input
                data-testid="msg-input"
                id="msg-input"
                className="text-input-field width-fill height-fill font-size-14"
                value={props.message}
                type="text"
                autoComplete="off"
                placeholder="Write a message..."
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setMessageContent(e)
                }
            ></input>
        </form>
    );
}
