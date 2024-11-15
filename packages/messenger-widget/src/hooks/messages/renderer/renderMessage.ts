import { MessageModel } from '../useMessage';
import { renderDelete } from './messageTypes/renderDelete';
import { renderDuplicates } from './messageTypes/renderDuplicates';
import { renderEdit } from './messageTypes/renderEdit';
import { renderReactions } from './messageTypes/renderReactions';
import { renderReadOpened } from './messageTypes/renderReadOpened';
import { renderReadReceived } from './messageTypes/renderReadReceived';
import { renderReply } from './messageTypes/renderReply';

/**
 * The storage contains the messages in the order they were received. This contains every message types not just the
 * ones that are displayed. To give the user the correct impression of the conversation we have to render the messages
 * That means we deal with DELETE, EDIT, REACTIONS and REPLIES.
 * Putting them to the right place in the conversation.
 */
export const renderMessage = (messages: MessageModel[]) => {
    const withReadReceived = renderReadReceived(messages);
    const withReadOpened = renderReadOpened(withReadReceived);
    const withDeletes = renderDelete(withReadOpened);
    const withReactions = renderReactions(withDeletes);
    const withReply = renderReply(withReactions);

    const withoutEdited = renderEdit(withReply);
    //Sort the messages by timestamp DESC to show them in the right order
    // withoutEdited.sort(
    //     (a, b) =>
    //         b.envelop.message.metadata.timestamp -
    //         a.envelop.message.metadata.timestamp,
    // );

    //There a several ways a message can added to the client. I.e via Websocket, multiple DS or from the storage.
    //This leads occasionally to duplicates we don't want to display.
    const withoutDuplicates = renderDuplicates(withoutEdited);
    //We reverse the array to display the messages in the right order
    return withoutDuplicates.reverse();
};
