import { MessageModel } from '../../useMessage';

export const renderReactions = (messages: MessageModel[]) => {
    //We filter out all messages that are reactions
    const reactions = messages
        .filter(
            (message) => message.envelop.message.metadata.type === 'REACTION',
        )
        .map((reaction) => reaction.envelop);

    //add reactions to the messages
    return (
        messages
            .map((message) => {
                const _reactions = [...message.reactions, ...reactions]
                    .filter(
                        (reaction) =>
                            reaction.message.metadata.referenceMessageHash ===
                            message.envelop.metadata?.messageHash,
                    )
                    //Filter duplicates, we only want to display a reaction once
                    //I.e if there are ten messages from type ❤️ we only want to display one ❤️
                    .filter((reaction, index, self) => {
                        return (
                            index ===
                            self.findIndex(
                                (r) =>
                                    r.message.message ===
                                    reaction.message.message,
                            )
                        );
                    });

                return {
                    ...message,
                    reactions: _reactions,
                };
            })
            //Get get rid of the reactions, as they are now part of the message
            .filter(
                (message) =>
                    message.envelop.message.metadata.type !== 'REACTION',
            )
    );
};
