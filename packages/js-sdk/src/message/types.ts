import { Envelop } from '@dm3-org/dm3-lib-messaging';
import {
    StorageAPI,
    StorageEnvelopContainer as StorageEnvelopContainerNew,
} from '@dm3-org/dm3-lib-storage';
export enum MessageActionType {
    NEW = 'NEW',
    EDIT = 'EDIT',
    DELETE = 'DELETE_REQUEST',
    REPLY = 'REPLY',
    REACT = 'REACTION',
    NONE = 'NONE',
}

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
