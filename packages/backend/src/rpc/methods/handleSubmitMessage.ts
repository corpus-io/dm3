import { schema, incomingMessage } from 'dm3-lib-delivery/dist.backend';
import { EncryptionEnvelop } from 'dm3-lib-messaging/dist.backend';
import { validateSchema } from 'dm3-lib-shared/dist.backend';
import 'dotenv/config';
import express from 'express';
import { WithLocals } from '../../types';
import { logDebug, logError, logInfo } from 'dm3-lib-shared';

export async function handleSubmitMessage(
    req: express.Request & { app: WithLocals },
    res: express.Response,
) {
    const {
        params: [stringifiedEnvelop, token],
    } = req.body;

    const envelop = JSON.parse(stringifiedEnvelop);

    if (!token) {
        logError('Auth token missing');
        return res.status(400).send('Auth token missing');
    }

    if (!envelop) {
        logError('Envelop missing');

        return res.status(400).send('Envelop missing');
    }

    const isSchemaValid = validateSchema(schema.MessageSubmission, {
        envelop,
        token,
    });

    if (!isSchemaValid) {
        const error = 'invalid schema';

        req.app.locals.logger.warn({
            method: 'WS SUBMIT MESSAGE',
            error,
        });
        return res.status(400).send({ error });
    }

    try {
        await incomingMessage(
            { envelop, token },
            req.app.locals.keys.signing,
            req.app.locals.keys.encryption,
            req.app.locals.deliveryServiceProperties.sizeLimit,
            req.app.locals.db.getSession,
            req.app.locals.db.createMessage,
            (socketId: string, envelop: EncryptionEnvelop) => {
                req.app.locals.io.sockets.to(socketId).emit('message', envelop);
            },
            req.app.locals.web3Provider,
            req.app.locals.db.getIdEnsName,
        );
        res.send(200);
    } catch (error) {
        req.app.locals.logger.warn({
            method: 'RPC SUBMIT MESSAGE',
            error,
        });
        logError({
            text: '[handleSubmitMessage]',
            error,
        });

        return res.status(400).send();
    }
}
