import { encryptAsymmetric } from '@dm3-org/dm3-lib-crypto';
import {
    buildEnvelop,
    EncryptionEnvelop,
    Envelop,
    getEnvelopSize,
    Message,
    MessageState,
} from '@dm3-org/dm3-lib-messaging';
import {
    Account,
    normalizeEnsName,
    ProfileKeys,
} from '@dm3-org/dm3-lib-profile';
import { sha256, stringify } from '@dm3-org/dm3-lib-shared';
import {
    StorageAPI,
    StorageEnvelopContainer as StorageEnvelopContainerNew,
} from '@dm3-org/dm3-lib-storage';
import { submitEnvelopsToReceiversDs } from '../api/ds/submitEnvelopsToReceiversDs';
import { Conversations } from '../conversation/Conversations';
import { Contact } from '../conversation/types';

const DEFAULT_MESSAGE_PAGESIZE = 100;

export enum MessageIndicator {
    SENT = 'SENT',
    RECEIVED = 'RECEIVED',
    READED = 'READED',
}

//Message source to identify where a message comes from. This is important to handle pagination of storage messages properly
export enum MessageSource {
    //Messages added by the client via addMessage
    Client,
    //Messages fetched from the storage
    Storage,
    //Messages fetched from the deliveryService
    DeliveryService,
    //Messages received from the Websocket
    WebSocket,
}

export type MessageModel = StorageEnvelopContainerNew & {
    reactions: Envelop[];
    replyToMessageEnvelop?: Envelop;
    source: MessageSource;
    indicator?: MessageIndicator;
};

export type MessageStorage = {
    [contact: string]: MessageModel[];
};

export class Messages {
    private readonly storageApi: StorageAPI;
    private readonly conversations: Conversations;
    private readonly account: Account;
    private readonly profileKeys: ProfileKeys;

    private messages: MessageStorage = {};

    constructor(storageApi: StorageAPI, conversations: Conversations) {
        this.storageApi = storageApi;
        this.conversations = conversations;
    }

    addMessage = async (
        _contactName: string,
        message: Message,
    ): Promise<{ isSuccess: boolean; error?: string }> => {
        const contact = normalizeEnsName(_contactName);
        //If a message is empty it should not be added

        if (!message.message || message.message.trim() === '') {
            return { isSuccess: false, error: 'Message is empty' };
        }

        //Find the recipient of the message in the contact list
        const recipient = this.conversations.conversations.find(
            (c) => c.contact.account.ensName === contact,
        );
        /**
         * Check if the recipient has a PublicEncrptionKey
         * if not only keep the msg at the senders storage
         */
        const recipientIsDm3User =
            !!recipient?.contact.account.profile?.publicEncryptionKey;

        //If the recipient is a dm3 user we can send the message to the delivery service
        if (recipientIsDm3User) {
            return await this._dispatchMessage(
                contact,
                recipient.contact,
                message,
            );
        }

        //There are cases were a messages is already to be send even though the contract hydration is not finished yet.
        //This happens if a message has been picked up from the delivery service and the clients sends READ_RECEIVE or READ_OPENED acknowledgements
        //In that case we've to check again to the if the user is a DM3 user, before we decide to keep the message
        const potentialReceiver = this.conversations.conversations.find(
            (c) => c.contact.account.ensName === contact,
        );

        //This should normally not happen, since the contact should be already in the contact list
        if (!potentialReceiver) {
            return await this._haltMessage(contact, message);
        }
        const hydratedC = await this.conversations.hydrateExistingContactAsync(
            potentialReceiver.contact,
        );

        //If the user is a DM3 user we can send the message to the delivery service
        if (hydratedC.contact.account.profile?.publicEncryptionKey) {
            return await this._dispatchMessage(
                contact,
                hydratedC.contact,
                message,
            );
        }

        //If neither the recipient nor the potential recipient is a DM3 user we store the message in the storage
        return await this._haltMessage(contact, message);
    };

    private _dispatchMessage = async (
        contact: string,
        recipient: Contact,
        message: Message,
    ) => {
        //Build the envelops based on the message and the users profileKeys.
        //For each deliveryServiceProfile a envelop is created that will be sent to the delivery service
        const envelops = await Promise.all(
            recipient.deliveryServiceProfiles.map(
                async (deliverServiceProfile) => {
                    return await buildEnvelop(
                        message,
                        (publicKey: string, msg: string) =>
                            encryptAsymmetric(publicKey, msg),
                        {
                            from: this.account!,
                            to: {
                                ...recipient!.account,
                                //Cover edge case of lukso names. TODO discuss with the team and decide how to dela with non ENS names
                                ensName: this.isLuksoName(recipient.name)
                                    ? recipient.account.ensName
                                    : recipient.name,
                            },
                            deliverServiceProfile,
                            keys: this.profileKeys!,
                        },
                    );
                },
            ),
        );

        // check if message size in within delivery service message size limit
        const isMsgInSizeLimit = await this.checkIfEnvelopAreInSizeLimit(
            //Find the biggest envelop
            envelops.map((e) => e.encryptedEnvelop),
            recipient.messageSizeLimit,
        );

        // If message size is larger than limit, return with error
        if (!isMsgInSizeLimit) {
            return {
                isSuccess: false,
                error: 'The size of the message is larger than limit '
                    .concat(recipient.messageSizeLimit.toString(), ' bytes. ')
                    .concat('Please reduce the message size.'),
            };
        }

        //StorageEnvelopContainerNew to store the message in the storage
        const messageStorageContainer = {
            //On the senders end we store only the first envelop
            envelop: envelops[0].envelop,
            messageState: MessageState.Created,
            reactions: [],
            //Message has just been created by the client
            source: MessageSource.Client,
        };

        //Add the message to the state
        this.messages[contact].push(messageStorageContainer);

        //Storage the message in the storage async
        this.storageApi.addMessage(contact, messageStorageContainer, false);

        // TODO send to receivers DS
        // When we have a recipient we can send the message using the socket connection

        //TODO either store msg in cache when sending or wait for the response from the delivery service¿
        const recipientDs = recipient.deliveryServiceProfiles;

        if (!recipientDs) {
            //TODO storage msg in storage
            return {
                isSuccess: false,
                error: 'Recipient has no delivery service profile',
            };
        }
        //Send the envelops to the delivery service
        await submitEnvelopsToReceiversDs(envelops);
        return { isSuccess: true };
    };

    private _haltMessage = async (contact: string, message: Message) => {
        //StorageEnvelopContainerNew to store the message in the storage
        const messageModel: MessageModel = {
            envelop: {
                message,
                metadata: {
                    encryptionScheme: 'x25519-chacha20-poly1305',
                    //since we don't have a recipient we can't encrypt the deliveryInformation
                    deliveryInformation: '',
                    //Because storing a message is always an internal process we dont need to sign it. The signature is only needed for the delivery service
                    signature: '',
                    messageHash: sha256(stringify(message)),
                    version: 'v1',
                },
            },
            messageState: MessageState.Created,
            source: MessageSource.Client,
            reactions: [],
        };
        this.messages[contact].push(messageModel);
        //Store the message and mark it as halted
        this.storageApi.addMessage(contact, messageModel, true);
        return { isSuccess: true };
    };
    //TODO migrate to real lukso name service
    isLuksoName = (input: string): boolean => {
        const regex = /^[a-zA-Z0-9]+#[a-zA-Z0-9]{4}\.up$/;
        return regex.test(input);
    };

    private checkIfEnvelopAreInSizeLimit = async (
        encryptedEnvelops: EncryptionEnvelop[],
        receiversMessageSizeLimit: number,
    ): Promise<boolean> => {
        try {
            const atLeastOneEnvelopIsToLarge = !!encryptedEnvelops
                //get the size of each envelop
                .map((encryptedEnvelop) => getEnvelopSize(encryptedEnvelop))
                //If any of the envelops is bigger than the receivers message size limit, return false
                .find((envelopSize) => {
                    return envelopSize > receiversMessageSizeLimit;
                });

            //If no envelop is to large, return true
            return !atLeastOneEnvelopIsToLarge;
        } catch (error) {
            console.error('Error in checkIfEnvelopAreInSizeLimit', error);
            return false;
        }
    };
}
