import { MessageModel } from '../../useMessage';

export const renderEdit = (_messages: MessageModel[]) => {
    //Copy messages object to not mutate the original object
    const messages: MessageModel[] = [..._messages];
    //Before processing the messages have to be sorted ASC by timestamp
    messages.sort(
        (a, b) =>
            a.envelop.message.metadata.timestamp -
            b.envelop.message.metadata.timestamp,
    );
    //To apply insertions we have to find every message that is an edit and find the original message
    //A message can be edited multiple times so we always have to find the original message
    //A path for a simple edit looks like [NEW, EDIT]
    //A path of a message that has been edited multiple times looks like [NEW, EDIT, EDIT, EDIT,...]
    //To display an edit message correctly we have to find the first and the last element of the path
    //Putting the first element of the path in the last index of the array and removing the rest of the elements
    const paths: number[][] = [];

    messages.forEach((msg, idx) => {
        const newPath = [];
        if (msg.envelop.message.metadata.type !== 'EDIT') {
            return;
        }

        //Idx is the beginning of the path. Now we have to go throuhg the messages and
        //find the original message recursifly.
        //Along the way we have to keep track of every index we pass.
        let currentIdx = idx;
        let currentMsg = msg;
        newPath.push(currentIdx);
        while (currentMsg.envelop.message.metadata.type === 'EDIT') {
            const originalMsg = messages.find(
                (m, i) =>
                    m.envelop.metadata?.messageHash ===
                    currentMsg.envelop.message.metadata.referenceMessageHash,
            );
            if (!originalMsg) {
                break;
            }
            currentIdx = messages.indexOf(originalMsg);
            currentMsg = originalMsg;
            newPath.push(currentIdx);
        }
        paths.push(newPath);
    });

    //When a message has been edited multiple times the path contains every subset of the path
    //i.e [NEW, EDIT, EDIT, EDIT] contains [NEW, EDIT], [NEW, EDIT, EDIT], [NEW, EDIT, EDIT, EDIT]
    //Hence we're using a SET to find the longest path
    const uniquePaths: { [id: number]: Set<number> } = {};

    paths.forEach((p) => {
        const originalMessageIndex = p[p.length - 1];

        if (!uniquePaths[originalMessageIndex]) {
            uniquePaths[originalMessageIndex] = new Set();
        }
        p.forEach((e) => uniquePaths[originalMessageIndex].add(e));
    });

    //We sort the SET to get the original message always at the first index and the last edit at the last index
    //Afterwards we turn the SET into an array to traverse it
    const uniquePathArray: number[][] = Object.values(uniquePaths).map(
        (pathSet) => [...pathSet].sort((a, b) => a - b),
    );

    for (const path of uniquePathArray) {
        //The message that is about to be edited
        const originalMessageIndex = path.shift();

        //The last edit that'll replace the first message
        const lastEditIndex = path.pop();

        //Swap the original message with the last edit
        const editedMessage = messages[lastEditIndex!];
        messages[originalMessageIndex!] = editedMessage;

        //remove the rest of the messages in the path
        path.forEach((idx) => {
            messages[idx] = undefined!;
        });
        messages[lastEditIndex!] = undefined!;
    }
    //Filter out all undefined messages
    return messages.filter((m) => m !== undefined);
};
