import './Message.css';
import { useContext } from 'react';
import { MessageProps } from '../../interfaces/props';
import { MessageActionType } from '../../utils/enum-type-utils';
import { AttachmentThumbnailPreview } from '../AttachmentThumbnailPreview/AttachmentThumbnailPreview';
import {
    getFilesAttachments,
    getMessageReactionStyleClassses,
    getMessageStyleClasses,
} from './bl';
import { UiViewContext } from '../../context/UiViewContext';
import { ReplyMessagePreview } from './ReplyMessagePreview';
import { MessageReactions } from './MessageReactions';
import { Action } from './Action';
import { MessageDetail } from './MessageDetail';
import { ProfilePreview } from './ProfilePreview';
import { AuthContext } from '../../context/AuthContext';
import { ConversationContext } from '../../context/ConversationContext';
import { DM3UserProfileContext } from '../../context/DM3UserProfileContext';
import { SettingsContext } from '../../context/SettingsContext';
import { MsgViewType } from '../../hooks/settings/useSettings';

export function Message(props: MessageProps) {
    const { messageView } = useContext(UiViewContext);

    const { displayName } = useContext(AuthContext);

    const { selectedContact } = useContext(ConversationContext);

    const { accountProfilePicture } = useContext(DM3UserProfileContext);

    const { msgViewSelected } = useContext(SettingsContext);

    const formatDate = (msgDate: number): string => {
        // create a date object
        const normalFormat = new Date(msgDate);
        // extract year from the date object
        const year = normalFormat.getFullYear();
        // extract month from the date object
        const month = normalFormat.toLocaleString('default', { month: 'long' });
        // extract date from the date object
        const date = normalFormat.getDate();
        // return in format date, month & year date Ex: 08 October, 2024
        return `${date} ${month}, ${year}`;
    };

    return (
        <>
            {/* 
                1. Shows the date, month and year 
                2. Only visible when new message layout is enabled
                3. Visible only before the first message of each date
            */}
            {msgViewSelected.viewType === MsgViewType.NEW &&
                props.isFirstMsgOfDay && (
                    <span className="msg-group-head">
                        {formatDate(props.envelop.message.metadata?.timestamp)}
                    </span>
                )}

            <div
                id={props.envelop.metadata?.messageHash}
                className={'text-primary-color msg'.concat(
                    ' ',
                    msgViewSelected.viewType !== MsgViewType.NEW
                        ? props.ownMessage
                            ? 'me-2 justify-content-end d-grid'
                            : 'ms-2 justify-content-start d-grid'
                        : 'ms-3 me-2 justify-content-start',
                )}
            >
                <div className="d-flex">
                    {/* Profile preview before every message content to show the actual sender of it */}
                    {msgViewSelected.viewType === MsgViewType.NEW && (
                        <span className={props.showProfile ? '' : 'invisible'}>
                            <ProfilePreview
                                picture={
                                    props.ownMessage
                                        ? accountProfilePicture
                                        : (selectedContact?.image as string)
                                }
                                ownMessage={props.ownMessage}
                            />
                        </span>
                    )}

                    <div
                        className={getMessageStyleClasses(
                            props,
                            messageView,
                            msgViewSelected.viewType === MsgViewType.OLD,
                        )}
                    >
                        {msgViewSelected.viewType === MsgViewType.NEW &&
                            props.showProfile && (
                                <div className="font-size-10 font-weight-800 mb-1">
                                    {props.ownMessage
                                        ? displayName
                                        : selectedContact?.name}{' '}
                                </div>
                            )}

                        {/* Reply message preview */}
                        <ReplyMessagePreview {...props} />

                        {/* Attachments preview */}
                        {props.envelop.message.attachments &&
                            props.envelop.message.attachments.length > 0 &&
                            props.envelop.message.metadata.type !==
                                MessageActionType.DELETE && (
                                <AttachmentThumbnailPreview
                                    filesSelected={getFilesAttachments(
                                        props.envelop.message.attachments,
                                    )}
                                    isMyMessage={props.ownMessage}
                                />
                            )}

                        {/* actual message */}
                        {props.message
                            ? props.message
                            : props.envelop.message.attachments &&
                              props.envelop.message.attachments.length > 0 &&
                              props.envelop.message.metadata.type !==
                                  MessageActionType.DELETE
                            ? ''
                            : props.ownMessage
                            ? 'You deleted this message.'
                            : 'This message was deleted.'}
                    </div>
                    {/* action 3 dots */}
                    <Action {...props} />
                </div>

                <div
                    className={getMessageReactionStyleClassses(
                        props,
                        msgViewSelected.viewType === MsgViewType.OLD,
                    )}
                >
                    {/* Own message */}
                    {props.ownMessage && <MessageDetail {...props} />}

                    {/* Contact's message */}
                    {msgViewSelected.viewType === MsgViewType.NEW &&
                        !props.ownMessage && <MessageDetail {...props} />}

                    {/* Reaction emojis */}
                    <MessageReactions {...props} />

                    {/* Contact's message */}
                    {msgViewSelected.viewType === MsgViewType.OLD &&
                        !props.ownMessage && <MessageDetail {...props} />}
                </div>
            </div>
        </>
    );
}
