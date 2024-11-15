import {
    Acknowledgement,
    getConversationId,
    schema,
} from '@dm3-org/dm3-lib-delivery';
import { normalizeEnsName } from '@dm3-org/dm3-lib-profile';
import { authorizationMiddleware } from '@dm3-org/dm3-lib-server-side';
import { validateSchema } from '@dm3-org/dm3-lib-shared';
import cors from 'cors';
import { ethers } from 'ethers';
import express from 'express';
import { IDatabase } from './persistence/getDatabase';

const syncAcknowledgementParamsSchema = {
    type: 'object',
    properties: {
        ensName: { type: 'string' },
    },
    required: ['ensName'],
    additionalProperties: false,
};
const syncAcknowledgementBodySchema = {
    type: 'object',
    properties: {
        acknowledgements: {
            type: 'array',
            items: schema.Acknowledgement,
        },
    },
    required: ['acknowledgements'],
    additionalProperties: false,
};

export default (
    web3Provider: ethers.providers.JsonRpcProvider,
    db: IDatabase,
    serverSecret: string,
) => {
    const router = express.Router();
    //TODO remove
    router.use(cors());
    router.param('ensName', async (req, res, next, ensName: string) => {
        authorizationMiddleware(
            req,
            res,
            next,
            ensName,
            db.hasAccount,
            web3Provider,
            serverSecret,
        );
    });
    //Returns all incoming messages for a specific contact name
    //TODO deprecated. remove in the future
    router.get(
        '/messages/:ensName/contact/:contactEnsName',
        async (req: express.Request, res, next) => {
            try {
                //retrieve the address for the contact name since it is used as a key in the db
                const receiverAddress = await web3Provider.resolveName(
                    req.params.ensName,
                );

                //If the address is not found we return a 404. This should normally not happen since the receiver always is known to the delivery service
                if (!receiverAddress) {
                    console.error(
                        'receiver address not found for name ',
                        req.params.ensName,
                    );
                    return res.status(404).send({
                        error:
                            'receiver address not found for name ' +
                            req.params.ensName,
                    });
                }

                //normalize the contact name
                const contactEnsName = await normalizeEnsName(
                    req.params.contactEnsName,
                );

                //The new layout resolves conversations using a conversation id [addr(reiceiver),ensName(sender)]
                const conversationId = getConversationId(
                    receiverAddress,
                    contactEnsName,
                );

                //Better 1000 than the previous fifty. This is a temporary solution until we implement pagination
                const messages = await db.getMessages(conversationId, 0, 1000);
                res.json(messages);
            } catch (e) {
                next(e);
            }
        },
    );

    /**
     * Retrieves incoming messages for a specific ENS name.
     *
     * @route GET /messages/incoming/:ensName
     * @param {express.Request} req - The request object, including the ENS name as a parameter
     * @param {express.Response} res - The response object.
     * @param {express.NextFunction} next - The next middleware function.
     * @returns {Promise<void>} - A promise that resolves with the incoming messages as a JSON response.
     * @throws {Error} - If an error occurs while retrieving the incoming messages.
     *
     * @example
     * GET /messages/incoming/example.ens
     */
    router.get(
        '/messages/incoming/:ensName',
        //@ts-ignore
        async (req: express.Request, res, next) => {
            try {
                //retrieve the address for the contact name since it is used as a key in the db
                const receiverAddress = await web3Provider.resolveName(
                    req.params.ensName,
                );
                //If the address is not found we return a 404. This should normally not happen since the receiver always is known to the delivery service
                if (!receiverAddress) {
                    console.error(
                        'receiver address not found for name ',
                        req.params.ensName,
                    );
                    return res.status(404).send({
                        error:
                            'receiver address not found for name ' +
                            req.params.ensName,
                    });
                }
                console.debug('get incoming messages for ', receiverAddress);
                //TODO use address
                const incomingMessages = await db.getIncomingMessages(
                    receiverAddress,
                    //Fetch the last 10 messages per conversation
                    //If we decide to add pagination for that endpoint we can pass this value as a param
                    1000,
                );
                res.json(incomingMessages);
            } catch (e) {
                next(e);
            }
        },
    );
    router.post(
        '/messages/:ensName/syncAcknowledgements/',
        async (req, res, next) => {
            const hasValidParams = validateSchema(
                syncAcknowledgementParamsSchema,
                req.params,
            );

            const hasValidBody = validateSchema(
                syncAcknowledgementBodySchema,
                req.body,
            );
            if (!hasValidParams || !hasValidBody) {
                console.error('sync acknowledgements invalid schema');
                return res.sendStatus(400);
            }

            try {
                const receiverAddress = await web3Provider.resolveName(
                    req.params.ensName,
                );

                //If the address is not found we return a 404. This should normally not happen since the receiver always is known to the delivery service
                if (!receiverAddress) {
                    console.error(
                        'receiver address not found for name ',
                        req.params.ensName,
                    );
                    return res.status(404).send({
                        error:
                            'receiver address not found for name ' +
                            req.params.ensName,
                    });
                }

                await Promise.all(
                    req.body.acknowledgements.map(
                        async (ack: Acknowledgement) => {
                            const contactEnsName = await db.getIdEnsName(
                                ack.contactAddress,
                            );
                            const conversationId = getConversationId(
                                receiverAddress,
                                contactEnsName,
                            );

                            await db.syncAcknowledge(
                                conversationId,
                                ack.messageHash,
                            );
                        },
                    ),
                );

                res.json();
            } catch (e) {
                next(e);
            }
        },
    );
    return router;
};
