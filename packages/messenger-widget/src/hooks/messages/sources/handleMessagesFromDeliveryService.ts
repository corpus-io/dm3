import { decryptAsymmetric } from '@dm3-org/dm3-lib-crypto';
import { Acknowledgment } from '@dm3-org/dm3-lib-delivery';
import {
    createReadOpenMessage,
    createReadReceiveMessage,
    EncryptionEnvelop,
    Envelop,
    MessageState,
} from '@dm3-org/dm3-lib-messaging';
import {
    Account,
    normalizeEnsName,
    ProfileKeys,
} from '@dm3-org/dm3-lib-profile';
import { ContactPreview } from '../../../interfaces/utils';
import { StoreMessageBatch } from '../../storage/useStorage';
import { MessageModel, MessageSource } from '../useMessage';
import { AcknowledgmentManager } from '../acknowledge/AcklowledgementManager';

export const handleMessagesFromDeliveryService = async (
    selectedContact: ContactPreview | undefined,
    account: Account,
    profileKeys: ProfileKeys,
    addConversation: (contactEnsName: string) => Promise<ContactPreview | void>,
    storeMessageBatch: StoreMessageBatch,
    fetchNewMessages: (ensName: string, contactAddress: string) => any,
    syncAcknowledgment: (
        ensName: string,
        acknoledgments: Acknowledgment[],
    ) => void,
    updateConversationList: (conversation: string, updatedAt: number) => void,
    addMessage: Function,
) => {
    //Fetch the messages from the delivery service
    const encryptedIncommingMessages = await fetchNewMessages(
        account.ensName,
        '',
    );

    console.log('MSG incommingMessages', encryptedIncommingMessages);

    const incommingMessages: MessageModel[] = await Promise.all(
        encryptedIncommingMessages.map(
            async (
                envelop: EncryptionEnvelop,
            ): Promise<MessageModel | null> => {
                try {
                    const decryptedEnvelop: Envelop = {
                        message: JSON.parse(
                            await decryptAsymmetric(
                                profileKeys?.encryptionKeyPair!,
                                JSON.parse(envelop.message),
                            ),
                        ),
                        postmark: JSON.parse(
                            await decryptAsymmetric(
                                profileKeys?.encryptionKeyPair!,
                                JSON.parse(envelop.postmark!),
                            ),
                        ),
                        metadata: envelop.metadata,
                    };
                    return {
                        envelop: decryptedEnvelop,
                        //Messages from the delivery service are already send by the sender
                        messageState: MessageState.Send,
                        reactions: [],
                        //The source of the message is the delivery service
                        source: MessageSource.DeliveryService,
                    };
                } catch (e) {
                    console.warn('unable to decrypt message ', e);
                    //We return null if the message could not be decrypted.
                    //This way we can filter out the message later an not acknowledge it, to keep it on the DS.
                    //Another client might be able to decrypt it.
                    return null;
                }
            },
        ),
    );

    const messagesSortedASC = incommingMessages
        //Filter out messages that could not be decrypted to only process and acknowledge the ones that could be decrypted
        .filter((message) => message !== null)
        .sort((a, b) => {
            return (
                a.envelop.postmark?.incommingTimestamp! -
                b.envelop.postmark?.incommingTimestamp!
            );
        });

    //Filter out messages that could not be decrypted to only process and acknowledge the ones that could be decrypted
    const decryptedMessages = incommingMessages.filter(
        (message) => message !== null,
    );

    //We're done if there are no messages to process
    if (decryptedMessages.length === 0) {
        return [];
    }

    //for each message find the sender of the message
    const contacts = decryptedMessages.map((message) =>
        normalizeEnsName(message.envelop.message.metadata.from),
    );
    //First we manage the contacts
    const uniqueContacts = Array.from(new Set(contacts));
    //TLD
    //We add every unique contact to the conversation state
    const previews = await Promise.all(
        uniqueContacts.map(async (contact) => {
            return await addConversation(contact);
        }),
    );

    //group messages by unique contact
    const groupedMessages = uniqueContacts.map((contact) => {
        const messages = decryptedMessages.filter(
            (message) => message.envelop.message.metadata.from === contact,
        );
        return {
            messages,
            //The TLD name is the original name of the contact, that can be found in the from field
            tldName: contact,
            aliasName: previews.find(
                (preview) => preview!.contactProfileLocation[0] === contact,
            )!.contactDetails.account.ensName,
        };
    });

    //Go through all grouped messages and store them in the storage
    await Promise.all(
        groupedMessages.map(async (conversation) => {
            // Update the conversation list with the latest message timestamp for each contact
            updateConversationList(
                //Alias(glaube ich)
                conversation.aliasName,
                messagesSortedASC[messagesSortedASC.length - 1].envelop.message
                    .metadata.timestamp,
            );
            //In the background we sync and acknowledge the messages and store then in the storage
            //Alias
            await storeMessageBatch(
                conversation.aliasName,
                conversation.messages,
            );
            //acknowledge the messages for the delivery service
            const acks: Acknowledgment[] = messagesSortedASC.map((message) => ({
                //Here we use the TLD name because the delivery service uses the TLD name to identify the contact
                //We cannot just use teh messageId because redis prevents us from finding messages by ID
                contactAddress: conversation.tldName,
                messageHash: message.envelop.metadata?.encryptedMessageHash!,
            }));
            await syncAcknowledgment(account.ensName, acks);

            //acknowledge the messages for the sender
            const acknowledgementManager = new AcknowledgmentManager(
                account,
                profileKeys,
                addMessage,
            );
            acknowledgementManager.ackMultiple(
                selectedContact,
                conversation.aliasName,
                messagesSortedASC,
            );
        }),
    );

    return groupedMessages;

    //     (data) =>
    //         data.envelop.message.metadata.type !== 'READ_RECEIVED' &&
    //         data.envelop.message.metadata.type !== 'READ_OPENED',
    // );

    // // if contact is selected send READ_OPENED acknowledgment to sender for all new messages received
    // if (
    //     ackToSend.length &&
    //     selectedContact! &&
    //     selectedContact!.contactDetails.account.ensName ===
    //         ackToSend[0].envelop.message.metadata.from
    // ) {
    //     // send READ_OPENED acknowledgment to sender's for all messages
    //     const openedMsgs = await Promise.all(
    //         ackToSend.map(async (message: MessageModel) => {
    //             return await createReadOpenMessage(
    //                 message.envelop.message.metadata.from,
    //                 account!.ensName,
    //                 'READ_OPENED',
    //                 profileKeys?.signingKeyPair.privateKey!,
    //                 message.envelop.metadata?.encryptedMessageHash as string,
    //             );
    //         }),
    //     );

    //     // add message
    //     await Promise.all(
    //         openedMsgs.map(async (msg, index) => {
    //             await addMessage(
    //                 //Alais
    //                 ackToSend[index].envelop.message.metadata.from,
    //                 msg,
    //             );
    //         }),
    //     );

    //     return messagesSortedASC;
    // }

    // if (ackToSend.length) {
    //     // send READ_RECEIVED acknowledgment to sender's for all new messages received
    //     const readedMsgs = await Promise.all(
    //         ackToSend.map(async (message: MessageModel) => {
    //             return await createReadReceiveMessage(
    //                 message.envelop.message.metadata.from,
    //                 account!.ensName,
    //                 'READ_RECEIVED',
    //                 profileKeys?.signingKeyPair.privateKey!,
    //                 message.envelop.metadata?.encryptedMessageHash as string,
    //             );
    //         }),
    //     );

    //     // add message
    //     await Promise.all(
    //         readedMsgs.map(async (msg, index) => {
    //             await addMessage(
    //                 ackToSend[index].envelop.message.metadata.from,
    //                 msg,
    //             );
    //         }),
    //     );
    // }

    // return messagesSortedASC;
};
