import { DeliveryServiceProperties } from '@dm3-org/dm3-lib-delivery';
import {
    EncryptionEnvelop,
    getEnvelopSize,
    schema,
} from '@dm3-org/dm3-lib-messaging';
import { DeliveryServiceProfileKeys } from '@dm3-org/dm3-lib-profile';
import {
    IWebSocketManager,
    logError,
    validateSchema,
} from '@dm3-org/dm3-lib-shared';
import 'dotenv/config';
import { ethers } from 'ethers';
import express from 'express';
import { Server } from 'socket.io';
import { MessageProcessor } from '../../message/MessageProcessor';
import { IDatabase } from '../../persistence/getDatabase';

export async function handleSubmitMessage(
    req: express.Request,
    res: express.Response,
    io: Server,
    deliveryServiceProperties: DeliveryServiceProperties,
    web3Provider: ethers.providers.JsonRpcProvider,
    db: IDatabase,
    keys: DeliveryServiceProfileKeys,
    webSocketManager: IWebSocketManager,
) {
    const {
        params: [stringifiedEnvelop],
    } = req.body;

    if (!stringifiedEnvelop) {
        logError('Envelop missing');

        return res.status(400).send('Envelop missing');
    }

    let envelop;
    try {
        envelop = JSON.parse(stringifiedEnvelop);
    } catch (error) {
        logError('Error parsing envelop');

        return res.status(400).send('Error parsing envelop');
    }

    const isSchemaValid = validateSchema(
        schema.EncryptionEnvelopeSchema,
        envelop,
    );

    if (!isSchemaValid) {
        const error = 'invalid schema';

        console.warn({
            method: 'WS SUBMIT MESSAGE',
            error,
        });
        return res.status(400).send({ error });
    }

    const messageProcessor = new MessageProcessor(
        db,
        web3Provider,
        webSocketManager,
        deliveryServiceProperties,
        keys,
        (socketId: string, envelop: EncryptionEnvelop) => {
            io.sockets.to(socketId).emit('message', envelop);
        },
    );

    try {
        await messageProcessor.processEnvelop(envelop);
        await db.countMessage(
            getEnvelopSize(envelop),
            deliveryServiceProperties,
        );
        res.sendStatus(200);
    } catch (error) {
        console.error('handle submit message error');
        console.error(error);

        return res.status(400).send();
    }
}
