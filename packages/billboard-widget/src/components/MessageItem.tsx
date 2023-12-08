import { Message } from 'dm3-lib-messaging';
import { format, formatRelative } from 'date-fns';
import { useMemo } from 'react';

import Avatar from './Avatar';

interface Props {
    message: Message;
    dateFormat?: string;
    relativeDate?: boolean;
}

function MessageItem(props: Props) {
    const { message, dateFormat = 'P', relativeDate = true } = props;

    const formattedDate = useMemo(() => {
        return relativeDate
            ? formatRelative(message.metadata.timestamp, new Date())
            : format(message.metadata.timestamp, dateFormat);
    }, [relativeDate, message.metadata.timestamp, dateFormat]);

    return (
        <div className="item-container">
            <Avatar identifier={message.metadata.from} />
            <div className="message">
                <div className="content text-sm">{message.message}</div>
                <div className="meta">
                    <div className="sender text-xxs">
                        "{message.metadata.from}"
                    </div>
                    <div className="time text-xxs">{formattedDate}</div>
                </div>
            </div>
        </div>
    );
}

export default MessageItem;
