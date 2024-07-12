import { incomingMessage } from '@dm3-org/dm3-lib-delivery';
import { EncryptionEnvelop, schema } from '@dm3-org/dm3-lib-messaging';
import { DeliveryServiceProfileKeys } from '@dm3-org/dm3-lib-profile';
import { IWebSocketManager, validateSchema } from '@dm3-org/dm3-lib-shared';
import { ethers } from 'ethers';
import { Server, Socket } from 'socket.io';
import { getDeliveryServiceProperties } from './config/getDeliveryServiceProperties';
import { IDatabase } from './persistence/getDatabase';

export function onConnection(
    io: Server,
    web3Provider: ethers.providers.JsonRpcProvider,
    db: IDatabase,
    keys: DeliveryServiceProfileKeys,
    serverSecret: string,
    webSocketManager: IWebSocketManager,
) {
    return (socket: Socket) => {
        socket.on('disconnect', () => {
            global.logger.info({
                method: 'WS DISCONNECT',
                socketId: socket.id,
            });
        });
        socket.on('connect', () => {
            console.log('socket on connect');
            console.log('---');
            console.log(socket);
            console.log('---');
        });

        socket.on('connection_error', (err) => {
            console.log(err.req); // the request object
            console.log(err.code); // the error code, for example 1
            console.log(err.message); // the error message, for example "Session ID unknown"
            console.log(err.context); // some additional error context
        });

        /**
         * Transfer an encrypted message to the delivery service the recipient uses
         */
        socket.on(
            'submitMessage',
            async (
                data: {
                    envelop: EncryptionEnvelop;
                    token: string;
                },
                callback,
            ) => {
                try {
                    const deliveryServiceProperties =
                        getDeliveryServiceProperties();
                    global.logger.info({
                        method: 'WS INCOMING MESSAGE',
                    });

                    const isSchemaValid = validateSchema(
                        schema.EncryptionEnvelopeSchema,
                        data.envelop,
                    );

                    if (!isSchemaValid) {
                        const error = 'invalid schema';

                        global.logger.warn({
                            method: 'WS SUBMIT MESSAGE',
                            error,
                        });
                        return callback({ error });
                    }

                    global.logger.info({
                        method: 'WS INCOMING MESSAGE',
                        keys: keys.encryptionKeyPair.publicKey,
                    });

                    await incomingMessage(
                        data.envelop,
                        keys.signingKeyPair,
                        keys.encryptionKeyPair,
                        deliveryServiceProperties.sizeLimit,
                        deliveryServiceProperties.notificationChannel,
                        db.getSession,
                        db.createMessage,
                        (socketId: string, envelop: EncryptionEnvelop) => {
                            io.sockets.to(socketId).emit('message', envelop);
                        },
                        web3Provider,
                        db.getIdEnsName,
                        db.getUsersNotificationChannels,
                        webSocketManager,
                    ),
                        callback({ response: 'success' });
                } catch (error: any) {
                    global.logger.warn({
                        method: 'WS SUBMIT MESSAGE',
                        error: (error as Error).toString(),
                    });
                    return callback({ error: error.message });
                }
            },
        );
    };
}
