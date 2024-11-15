import { MessageModel } from '../../useMessage';

export const renderReply = (messages: MessageModel[]) => {
    return messages.map((message) => {
        if (message.envelop.message.metadata.type === 'REPLY') {
            //TODO we've to figure out how to get a message from a different chunk (Alex)
            const replyToMessageEnvelop = messages.find(
                (m) =>
                    m.envelop.metadata?.messageHash ===
                    message.envelop.message.metadata.referenceMessageHash,
            );
            return {
                ...message,
                replyToMessageEnvelop: replyToMessageEnvelop?.envelop,
            };
        }
        return message;
    });
};
