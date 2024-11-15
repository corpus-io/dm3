import { Account, ProfileKeys } from '@dm3-org/dm3-lib-profile';
import { MessageModel } from '../useMessage';
import {
    createReadOpenMessage,
    createReadReceiveMessage,
} from '@dm3-org/dm3-lib-messaging';
import { ContactPreview } from '../../../interfaces/utils';

//A receipt is a Dm3 message directed to the sender of the original message
//It can either indicate that the message has been opened via READ_OPENED or that the message has been received via READ_RECEIVED
//The ReceiptDispatcher is responsible for checking which type of receipt should be sent and dispatch it via the useMessage hook
export class ReceiptDispatcher {
    private readonly account: Account;
    private readonly profileKeys: ProfileKeys;
    private readonly addMessage: Function;
    constructor(
        account: Account,
        profileKeys: ProfileKeys,
        addMessage: Function,
    ) {
        this.account = account;
        this.profileKeys = profileKeys;
        this.addMessage = addMessage;
    }
    private sendOpendReceipt = async (
        contactAliasName: string,
        messageModel: MessageModel,
    ) => {
        const readMsg = await createReadOpenMessage(
            messageModel.envelop.message.metadata.from,
            this.account!.ensName,
            'READ_OPENED',
            this.profileKeys?.signingKeyPair.privateKey!,
            messageModel.envelop.metadata?.messageHash as string,
        );

        //add the message to dispatch it via useMessage hook
        await this.addMessage(contactAliasName, readMsg);
    };

    private sendReceivedReceipte = async (
        contactAliasName: string,
        messageModel: MessageModel,
    ) => {
        const readMsg = await createReadReceiveMessage(
            messageModel.envelop.message.metadata.from,
            this.account!.ensName,
            'READ_RECEIVED',
            this.profileKeys?.signingKeyPair.privateKey!,
            messageModel.envelop.metadata?.messageHash as string,
        );

        //add the message to dispatch it via useMessage hook
        await this.addMessage(contactAliasName, readMsg);
    };

    public async sendMultiple(
        selectedContact: ContactPreview | undefined,
        contactAliasName: string,
        messageModel: MessageModel[],
    ) {
        await Promise.all(
            messageModel.map((msg) => {
                this.sendSingle(selectedContact, contactAliasName, msg);
            }),
        );
    }

    public async sendSingle(
        selectedContact: ContactPreview | undefined,
        contactAliasName: string,
        messageModel: MessageModel,
    ) {
        //We only want to acknowledge messages from type NEW or REPLY. Every other message type can be neglected for now
        const shouldAcknowledgeMessage =
            messageModel.envelop.message.metadata.type === 'NEW' ||
            messageModel.envelop.message.metadata.type === 'EDIT' ||
            messageModel.envelop.message.metadata.type === 'REPLY';
        //Check if the selected contact is the sender of the message.
        // If that is the case we've to acknowledge the message and send a READ_OPENED acknowledgement to the sender
        const selectedContactIsSender =
            selectedContact?.contactDetails.account.ensName ===
            contactAliasName;

        //We acknowledge that we've received the message by sending a READ_RECEIVED acknowledgement to the sender
        if (shouldAcknowledgeMessage) {
            await this.sendReceivedReceipte(contactAliasName, messageModel);
            console.log('sent received receipt to ', contactAliasName);
        }

        if (shouldAcknowledgeMessage && selectedContactIsSender) {
            // if contact is selected then send READ_OPENED acknowledgement to sender for new message received
            await this.sendOpendReceipt(contactAliasName, messageModel);
            console.log('sent opened receipt to ', contactAliasName);
        }
    }
}
