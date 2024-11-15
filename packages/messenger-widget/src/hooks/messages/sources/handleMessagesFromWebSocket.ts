import { decryptAsymmetric } from '@dm3-org/dm3-lib-crypto';
import {
    EncryptionEnvelop,
    Envelop,
    MessageState,
} from '@dm3-org/dm3-lib-messaging';
import { normalizeEnsName, ProfileKeys } from '@dm3-org/dm3-lib-profile';
import { ContactPreview } from '../../../interfaces/utils';
import { StoreMessageAsync } from '../../storage/useStorage';
import { ReceiptDispatcher } from '../receipt/ReceiptDispatcher';
import { MessageModel, MessageSource, MessageStorage } from '../useMessage';

export const handleMessagesFromWebSocket = async (
    addConversation: (
        contactEnsName: string,
    ) => Promise<ContactPreview | undefined>,
    setMessages: Function,
    storeMessage: StoreMessageAsync,
    profileKeys: ProfileKeys,
    selectedContact: ContactPreview,
    encryptedEnvelop: EncryptionEnvelop,
    acknowledgementManager: ReceiptDispatcher,
    updateConversationList: (conversation: string, updatedAt: number) => void,
) => {
    const decryptedEnvelop: Envelop = {
        message: JSON.parse(
            await decryptAsymmetric(
                profileKeys?.encryptionKeyPair!,
                JSON.parse(encryptedEnvelop.message),
            ),
        ),
        postmark: JSON.parse(
            await decryptAsymmetric(
                profileKeys?.encryptionKeyPair!,
                JSON.parse(encryptedEnvelop.postmark!),
            ),
        ),
        metadata: encryptedEnvelop.metadata,
    };

    //we wait for the contact to be added to resolve TLD to alias
    const contactPreview = await addConversation(
        normalizeEnsName(decryptedEnvelop.message.metadata.from),
    );

    // Resolve TLD to alias
    const contact = contactPreview?.contactDetails.account.ensName!;

    const messageState =
        selectedContact?.contactDetails.account.ensName === contact
            ? MessageState.Read
            : MessageState.Send;

    const messageModel: MessageModel = {
        envelop: decryptedEnvelop,
        messageState,
        reactions: [],
        source: MessageSource.WebSocket,
    };

    setMessages((prev: MessageStorage) => {
        //Check if message already exists
        if (
            prev[contact]?.find(
                (m) =>
                    m.envelop.metadata?.messageHash ===
                    messageModel.envelop.metadata?.messageHash,
            )
        ) {
            return prev;
        }
        return {
            ...prev,
            [contact]: [...(prev[contact] ?? []), messageModel],
        };
    });

    //Let the acknowledgement manager handle the message acknowledgement
    await acknowledgementManager.sendSingle(
        selectedContact,
        contact,
        messageModel,
    );

    // Update the conversation with the latest message timestamp
    updateConversationList(
        contact,
        messageModel.envelop.message.metadata.timestamp,
    );

    storeMessage(contact, messageModel);
};
