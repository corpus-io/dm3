import './MessageInputBox.css';
import { useContext, useEffect, useState } from 'react';
import { setAttachmentsOnEditMessage } from './bl';
import { MessageActionType } from '../../utils/enum-type-utils';
import { EmojiModal } from '../EmojiModal/EmojiModal';
import { IAttachmentPreview } from '../../interfaces/utils';
import { ReplyMessagePreview } from '../ReplyMessagePreview/ReplyMessagePreview';
import { AttachmentPreview } from '../AttachmentPreview/AttachmentPreview';
import { AttachmentSelector } from '../AttachmentSelector/AttachmentSelector';
import { EmojiSelector } from '../EmojiSelector/EmojiSelector';
import { MessageInputField } from '../MessageInputField/MessageInputField';
import { SendMessage } from '../SendMessage/SendMessage';
import { ConversationContext } from '../../context/ConversationContext';
import { DM3ConfigurationContext } from '../../context/DM3ConfigurationContext';
import { UiViewContext } from '../../context/UiViewContext';
import { ModalContext } from '../../context/ModalContext';

export function MessageInputBox() {
    const { selectedContact, selectedContactName } =
        useContext(ConversationContext);
    const { dm3Configuration } = useContext(DM3ConfigurationContext);
    const { messageView, setMessageView } = useContext(UiViewContext);
    const { openEmojiPopup } = useContext(ModalContext);

    const [message, setMessage] = useState('');
    const [filesSelected, setFilesSelected] = useState<IAttachmentPreview[]>(
        [],
    );

    function setFiles(files: IAttachmentPreview[]) {
        setFilesSelected(files);
    }

    function setMessageText(msg: string) {
        setMessage(msg);
    }

    const setChatContainerHeight = () => {
        const element = document.getElementById('chat-msgs');
        if (element) {
            if (filesSelected.length > 0) {
                element.style.height = 'calc(100% - 102px) !important';
            } else {
                element.style.height = 'calc(100% - 65px) !important';
            }
        }
    };

    useEffect(() => {
        setChatContainerHeight();
    }, [filesSelected]);

    useEffect(() => {
        if (messageView.actionType === MessageActionType.EDIT) {
            setMessage(messageView.messageData?.message as string);
            setAttachmentsOnEditMessage(messageView, setFiles);
        }
    }, [messageView]);

    /**
     * On change of contact selected
     * Resets the input message and message view as no message is selected
     */
    useEffect(() => {
        setMessageView({
            actionType: MessageActionType.NONE,
            messageData: undefined,
        });
        setMessage('');
    }, [selectedContactName]);

    useEffect(() => {
        setFilesSelected([]);
        setChatContainerHeight();
    }, [selectedContact]);

    return (
        <div
            id="msg-input-box-container"
            data-testid="msg-input-box-container"
            className="mb-1 ms-2 me-2 p-1 msg-input-box-container width-fill"
        >
            {/* Reply message preview */}
            {messageView.actionType === MessageActionType.REPLY && (
                <ReplyMessagePreview setFiles={setFiles} />
            )}

            {/* Emoji popup modal */}
            {openEmojiPopup.action && (
                <EmojiModal message={message} setMessage={setMessage} />
            )}

            {/* Message emoji, file & input window */}
            <div className="d-flex width-fill">
                <div
                    className={'chat-action-items width-fill border-radius-6'.concat(
                        ' ',
                        messageView.actionType === MessageActionType.REPLY
                            ? 'reply-msg-active'
                            : '',
                    )}
                >
                    {/* Attachments selected preview */}
                    {filesSelected.length > 0 && (
                        <AttachmentPreview
                            filesSelected={filesSelected}
                            setFiles={setFiles}
                        />
                    )}

                    <div className="d-flex align-items-center width-fill">
                        <div className="d-flex align-items-center text-secondary-color">
                            {/* Attachment selector modal */}
                            {(!dm3Configuration.hideFunction ||
                                !dm3Configuration.hideFunction
                                    .split(',')
                                    .includes('attachments')) && (
                                <AttachmentSelector
                                    filesSelected={filesSelected}
                                    setFiles={setFiles}
                                />
                            )}

                            {/* Emoji selector modal  */}
                            <EmojiSelector />
                        </div>

                        {/* Input msg form */}
                        <MessageInputField
                            filesSelected={filesSelected}
                            message={message}
                            setFiles={setFiles}
                            setMessageText={setMessageText}
                        />

                        {/* Send button */}
                        <SendMessage
                            filesSelected={filesSelected}
                            message={message}
                            setFiles={setFiles}
                            setMessageText={setMessageText}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
