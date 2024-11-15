import './Message.css';
import { getFilesAttachments, scrollToMessage } from './bl';
import { MessageProps } from '../../interfaces/props';
import { MessageActionType } from '../../utils/enum-type-utils';
import { AttachmentThumbnailPreview } from '../AttachmentThumbnailPreview/AttachmentThumbnailPreview';

export function ReplyMessagePreview(props: MessageProps) {
    return (
        props.replyToMessageEnvelop &&
        props.envelop.message.metadata.type === MessageActionType.REPLY && (
            <div
                className={'reply-preview d-flex border-radius-4 pointer-cursor'.concat(
                    props.ownMessage
                        ? ' reply-preview-own'
                        : ' reply-preview-contact',
                )}
                onClick={() =>
                    scrollToMessage(
                        props.replyToMessageEnvelop?.metadata?.messageHash!,
                    )
                }
            >
                <AttachmentThumbnailPreview
                    filesSelected={getFilesAttachments(
                        props.replyToMessageEnvelop?.message.attachments ?? [],
                    )}
                    isMyMessage={props.ownMessage}
                    isReplyMsgAttachments={true}
                />
                <div className="user-name">
                    {props.replyToMessageEnvelop.message.metadata.from.length >
                    25
                        ? props.replyToMessageEnvelop.message.metadata.from
                              .substring(0, 25)
                              .concat(': ')
                        : props.replyToMessageEnvelop.message.metadata.from.concat(
                              ':',
                          )}
                </div>
                {props.replyToMessageEnvelop.message.message
                    ? props.replyToMessageEnvelop.message.message
                          .substring(0, 20)
                          .concat('...')
                    : ''}
            </div>
        )
    );
}
