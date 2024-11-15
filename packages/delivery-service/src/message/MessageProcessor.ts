import { DeliveryServiceProfileKeys } from '@dm3-org/dm3-lib-profile';
import { IWebSocketManager, stringify } from '@dm3-org/dm3-lib-shared';
import { ethers } from 'ethers';

import {
    addPostmark,
    decryptDeliveryInformation,
    DeliveryServiceProperties,
    getConversationId,
    NotificationBroker,
    NotificationType,
    spamFilter,
} from '@dm3-org/dm3-lib-delivery';
import {
    DeliveryInformation,
    EncryptionEnvelop,
    getEnvelopSize,
} from '@dm3-org/dm3-lib-messaging';
import { IDatabase } from '../persistence/getDatabase';

type onSubmitMessage = (socketId: string, envelop: EncryptionEnvelop) => void;

export class MessageProcessor {
    private readonly db: IDatabase;
    private readonly provider: ethers.providers.JsonRpcProvider;
    private readonly webSocketManager: IWebSocketManager;
    private readonly deliveryServiceProperties: DeliveryServiceProperties;
    private readonly deliveryServiceProfileKeys: DeliveryServiceProfileKeys;
    private readonly onSubmitMessage: onSubmitMessage;

    constructor(
        db: IDatabase,
        provider: ethers.providers.JsonRpcProvider,
        webSocketManager: IWebSocketManager,
        deliveryServiceProperties: DeliveryServiceProperties,
        deliveryServiceProfileKeys: DeliveryServiceProfileKeys,
        onSubmitMessage: onSubmitMessage,
    ) {
        this.db = db;
        this.provider = provider;
        this.webSocketManager = webSocketManager;
        this.deliveryServiceProperties = deliveryServiceProperties;
        this.deliveryServiceProfileKeys = deliveryServiceProfileKeys;
        this.onSubmitMessage = onSubmitMessage;
    }

    /**
     * Handles an incoming message.
     * Either stores the message or sends it directly to the receiver if a socketId is provided
     * In order to be considered valid a incoming message has to meet the following criterias
     * 1. The message size must be lower than the sizeLimit specified by the deliveryService {@see messageIsToLarge}
     * 2. The DeliveryServiceToken used by the sender has to be valid
     * 3. The receiver has to have a account at the deliveryService
     * 4. The message must pass every {@see SpamFilterRule} the receiver declared
     */
    public async processEnvelop(envelop: EncryptionEnvelop): Promise<void> {
        //Checks the size of the incoming message
        if (
            this.messageIsTooLarge(
                envelop,
                this.deliveryServiceProperties.sizeLimit,
            )
        ) {
            console.error('Message is too large');
            throw Error('Message is too large');
        }
        console.debug('process incomingMessage');

        //Decrypts the encryptryInformation with the KeyPair of the deliveryService
        const deliveryInformation: DeliveryInformation =
            await decryptDeliveryInformation(
                envelop,
                this.deliveryServiceProfileKeys.encryptionKeyPair,
            );
        console.debug(
            'incomingMessage delivery Information',
            deliveryInformation,
        );

        //the delivery service has to accept any message to the receiver regardelss of the place they have choosen to host their profile.
        //That means no matter what name the receiver has chosen to use, the delivery service has to resolve it to the correct address
        //i.E if alice.eth resolves to 0x123
        //and alice.gno resolves to 0x123 aswell, the ds has to accept both
        const receiverAddress = await this.provider.resolveName(
            deliveryInformation.to,
        );

        if (!receiverAddress) {
            console.debug(
                'unable to resolve address for ',
                deliveryInformation.to,
            );
            throw Error('unable to resolve receiver address');
        }

        console.debug(
            `resolved address for ${deliveryInformation.to} to ${receiverAddress}`,
        );

        const conversationId = getConversationId(
            //We use the receivers address as the first part of the conversationId
            receiverAddress,
            //We use the senders ens name as the second part of the conversationId.
            //We do not use the address because the sender might have not set an resolver or the addr record might not be set.
            //Its up to the client to resolve the ens name to the address
            deliveryInformation.from,
        );
        console.debug(conversationId, deliveryInformation);

        //Retrieves the account of the receiver
        const receiverAccount = await this.db.getAccount(receiverAddress);
        if (!receiverAccount) {
            console.debug('unknown user ', deliveryInformation.to);
            throw Error('unknown account');
        }

        //Checks if the message is spam
        if (
            await spamFilter.isSpam(
                this.provider,
                receiverAccount,
                deliveryInformation,
            )
        ) {
            console.debug(
                `incomingMessage from ${deliveryInformation.to} is spam`,
            );
            throw Error('Message does not match spam criteria');
        }

        const receiverEncryptionKey =
            receiverAccount.signedUserProfile.profile.publicEncryptionKey;

        const envelopWithPostmark: EncryptionEnvelop = {
            ...envelop,
            metadata: {
                ...envelop.metadata,
                //Alwaays store the encrypted metadata
                deliveryInformation,
            },
            postmark: stringify(
                await addPostmark(
                    envelop,
                    receiverEncryptionKey,
                    this.deliveryServiceProfileKeys.signingKeyPair.privateKey,
                ),
            ),
        };
        console.debug('storeNewMessage', conversationId);
        await this.db.createMessage(
            receiverAddress,
            conversationId,
            envelopWithPostmark,
        );

        //If there is currently a webSocket connection open to the receiver, the message will be directly send.
        if (await this.webSocketManager.isConnected(receiverAddress)) {
            //Client is already connect to the delivery service and the message can be dispatched
            //TODO MOVE send method to the WebSocketManager
            this.onSubmitMessage(
                receiverAccount.socketId!,
                envelopWithPostmark,
            );

            console.debug('WS send to socketId ', receiverAccount.socketId);
            //If not we're notifing the user that there is a new message waiting for them
        } else {
            try {
                const { sendNotification } = NotificationBroker(
                    this.deliveryServiceProperties.notificationChannel,
                    NotificationType.NEW_MESSAGE,
                );
                await sendNotification(
                    deliveryInformation,
                    this.db.getUsersNotificationChannels,
                );
                await this.db.countNotification(this.deliveryServiceProperties);
            } catch (err) {
                console.log(
                    'Unable to send Notification. There might be an error in the config.yml. Message has been received regardless',
                );
                console.error(err);
            }
        }
    }

    private messageIsTooLarge(envelop: EncryptionEnvelop, sizeLimit: number) {
        return getEnvelopSize(envelop) > sizeLimit;
    }
}
