import './EmojiModal.css';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { useContext, useEffect, useRef } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { ConversationContext } from '../../context/ConversationContext';
import { EmojiProps, MessageProps } from '../../interfaces/props';
import { MessageActionType } from '../../utils/enum-type-utils';
import { hideMsgActionDropdown } from '../MessageInputBox/bl';
import { createReactionMessage } from '@dm3-org/dm3-lib-messaging';
import { MessageContext } from '../../context/MessageContext';
import { UiViewContext } from '../../context/UiViewContext';
import { ModalContext } from '../../context/ModalContext';

export function EmojiModal(props: EmojiProps) {
    const emojiRef: any = useRef();

    const { setMessageView } = useContext(UiViewContext);
    const { account, profileKeys } = useContext(AuthContext);
    const { addMessage } = useContext(MessageContext);
    const { selectedContact } = useContext(ConversationContext);
    const { setOpenEmojiPopup, openEmojiPopup, setLastMessageAction } =
        useContext(ModalContext);

    // handles mouse click outside of emoji modal and closes the modal automatically
    const handleClickOutside = (e: { target: any }) => {
        if (e.target && e.target.id === 'emoji-modal-handler') {
            // don't close the popup when clicked on emoji modal opener
            return;
        } else if (emojiRef.current && !emojiRef.current.contains(e.target)) {
            // close the popup when clicked outside
            setOpenEmojiPopup({ action: false, data: undefined });
        }
    };

    // Handles emoji selection in normal message or as a message reaction
    const handleEmojiSelect = async (data: string) => {
        let messageProps: MessageProps;
        // emoji reaction
        if (openEmojiPopup.action && openEmojiPopup.data) {
            messageProps = openEmojiPopup.data as MessageProps;
            setOpenEmojiPopup({ action: false, data: undefined });
            setAction();
            await reactToMessage(data, messageProps);
        } else {
            // normal message containing emoji
            props.setMessage(props.message.concat(data));
        }
    };

    const setAction = () => {
        setMessageView({
            messageData: undefined,
            actionType: MessageActionType.REACT,
        });
        hideMsgActionDropdown();
    };

    const reactToMessage = async (message: string, props: MessageProps) => {
        if (!selectedContact) {
            throw Error('no contact selected');
        }

        // Filters if the reaction already exists
        const filteredReactions = props.reactions.filter(
            (data) => data.message.message === message,
        );

        // if same reaction already exists, then it should not be added again so returns
        if (filteredReactions.length) {
            return;
        }

        setMessageView({
            actionType: MessageActionType.NONE,
            messageData: undefined,
        });

        const referenceMessageHash = props.envelop.metadata?.messageHash;

        // react to the message
        const messageData = await createReactionMessage(
            selectedContact.contactDetails.account.ensName as string,
            account!.ensName,
            message,
            profileKeys?.signingKeyPair.privateKey!,
            referenceMessageHash as string,
        );

        await addMessage(
            selectedContact?.contactDetails.account.ensName!,
            messageData,
        );

        setLastMessageAction(MessageActionType.REACT);
    };

    // handles click on outside of emoji modal to autoclose the modal
    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    });

    return (
        <>
            {
                <div className="emoji-modal-container" ref={emojiRef}>
                    <Picker
                        data={data}
                        previewPosition="none"
                        theme="dark"
                        searchPosition="none"
                        autoFocus={false}
                        onEmojiSelect={(data: any) =>
                            handleEmojiSelect(data.native)
                        }
                    />
                </div>
            }
        </>
    );
}
