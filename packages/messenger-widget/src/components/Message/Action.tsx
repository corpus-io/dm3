import './Message.css';
import { useContext, useState } from 'react';
import { MessageProps } from '../../interfaces/props';
import { MessageAction } from '../MessageAction/MessageAction';
import { ConversationContext } from '../../context/ConversationContext';
import { MessageActionType } from '../../utils/enum-type-utils';

export function Action(props: MessageProps) {
    const { selectedContact } = useContext(ConversationContext);

    // state to show action items three dots
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseOver = () => {
        if (!props.envelop.metadata?.messageHash) {
            return;
        }
        setIsHovered(true);
    };

    const handleMouseOut = () => {
        setIsHovered(false);
    };

    const isMsgDeleted = props.message
        ? false
        : props.envelop.message.attachments &&
          props.envelop.message.attachments.length > 0 &&
          props.envelop.message.metadata.type !== MessageActionType.DELETE
        ? false
        : true;

    return (
        <div
            className={'msg-action-container d-flex pointer-cursor border-radius-3 position-relative'.concat(
                ' ',
                !props.envelop.metadata?.messageHash ? 'invisible' : '',
                selectedContact?.contactDetails.account.profile && !isMsgDeleted
                    ? ''
                    : 'hide-action',
            )}
            onMouseOver={handleMouseOver}
            onMouseLeave={handleMouseOut}
        >
            <div
                className={'msg-action-btn'.concat(
                    isHovered ? ' msg-action-btn-highlighted' : '',
                )}
            >
                ···
            </div>
            {isHovered && <MessageAction {...props} />}
        </div>
    );
}
