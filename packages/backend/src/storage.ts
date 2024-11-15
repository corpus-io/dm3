import { normalizeEnsName } from '@dm3-org/dm3-lib-profile';
import { authorizationMiddleware } from '@dm3-org/dm3-lib-server-side';
import { sha256, validateSchema } from '@dm3-org/dm3-lib-shared';
import cors from 'cors';
import { ethers } from 'ethers';
import express, { NextFunction, Request, Response } from 'express';
import { IBackendDatabase } from './persistence/getDatabase';
import { MessageRecord } from './persistence/storage';
import { AddMessageBatchRequest } from './schema/storage/AddMessageBatchRequest';
import { AddMessageRequest } from './schema/storage/AddMesssageRequest';
import { EditMessageBatchRequest } from './schema/storage/EditMessageBatchRequest';
import { PaginatedRequest } from './schema/storage/PaginatedRequest';

const DEFAULT_CONVERSATION_PAGE_SIZE = 10;
const DEFAULT_MESSAGE_PAGE_SIZE = 100;

export default (
    db: IBackendDatabase,
    web3Provider: ethers.providers.JsonRpcProvider,
    serverSecret: string,
) => {
    const router = express.Router();

    //TODO remove
    router.use(cors());

    router.param(
        'ensName',
        async (
            req: Request,
            res: Response,
            next: NextFunction,
            ensName: string,
        ) => {
            authorizationMiddleware(
                req,
                res,
                next,
                ensName,
                db.hasAccount,
                web3Provider,
                serverSecret,
            );
        },
    );

    router.post('/new/:ensName/editMessageBatch', async (req, res, next) => {
        const { encryptedContactName, editMessageBatchPayload } = req.body;

        const schemaIsValid = validateSchema(EditMessageBatchRequest, req.body);

        if (!schemaIsValid) {
            res.status(400).send('invalid schema');
            return;
        }

        try {
            const ensName = normalizeEnsName(req.params.ensName);
            const getUniqueMessageId = (messageId: string) =>
                sha256(ensName + messageId);
            await db.editMessageBatch(
                ensName,
                encryptedContactName,
                editMessageBatchPayload.map((message: any) => ({
                    messageId: getUniqueMessageId(message.messageId),
                    createdAt: message.createdAt,
                    encryptedEnvelopContainer:
                        message.encryptedEnvelopContainer,
                })),
            );
            return res.sendStatus(200);
        } catch (e) {
            next(e);
        }
    });

    router.post('/new/:ensName/addMessage', async (req, res, next) => {
        const {
            encryptedEnvelopContainer,
            encryptedContactName,
            messageId,
            createdAt,
            isHalted,
        } = req.body;

        const schemaIsValid = validateSchema(AddMessageRequest, req.body);

        if (!schemaIsValid) {
            res.status(400).send('invalid schema');
            return;
        }

        try {
            const ensName = normalizeEnsName(req.params.ensName);
            //Since the message is fully encrypted, we cannot use the messageHash as an identifier.
            //Instead we use the hash of the ensName and the messageId to have a unique identifier
            const uniqueMessageId = sha256(ensName + messageId);
            const success = await db.addMessageBatch(
                ensName,
                encryptedContactName,
                [
                    {
                        messageId: uniqueMessageId,
                        encryptedEnvelopContainer,
                        createdAt,
                        isHalted,
                    },
                ],
            );
            if (success) {
                return res.sendStatus(200);
            }
            res.status(400).send('unable to add message');
        } catch (e) {
            next(e);
        }
    });
    router.post('/new/:ensName/addMessageBatch', async (req, res, next) => {
        const { messageBatch, encryptedContactName } = req.body;

        const schemaIsValid = validateSchema(AddMessageBatchRequest, req.body);

        if (!schemaIsValid) {
            res.status(400).send('invalid schema');
            return;
        }

        try {
            const ensName = normalizeEnsName(req.params.ensName);
            const getUniqueMessageId = (messageId: string) =>
                sha256(ensName + messageId);

            await db.addMessageBatch(
                ensName,
                encryptedContactName,
                messageBatch.map((message: MessageRecord) => ({
                    messageId: getUniqueMessageId(message.messageId),
                    createdAt: message.createdAt,
                    encryptedEnvelopContainer:
                        message.encryptedEnvelopContainer,
                    isHalted: message.isHalted,
                })),
            );
            return res.sendStatus(200);
        } catch (e) {
            return res.status(400).send('unable to add message batch');
        }
    });

    router.get(
        '/new/:ensName/getMessages/:encryptedContactName/',
        async (req, res, next) => {
            const encryptedContactName = req.params.encryptedContactName;

            const pageSize =
                parseInt(req.query.pageSize as string) ||
                DEFAULT_MESSAGE_PAGE_SIZE;
            const offset = parseInt(req.query.offset as string) || 0;

            const schemaIsValid = validateSchema(PaginatedRequest, {
                pageSize,
                offset,
            });

            if (!schemaIsValid) {
                res.status(400).send('invalid schema');
                return;
            }
            try {
                const ensName = normalizeEnsName(req.params.ensName);
                const messages = await db.getMessagesFromStorage(
                    ensName,
                    encryptedContactName,
                    pageSize,
                    offset,
                );
                return res.json(messages);
            } catch (e) {
                next(e);
            }
        },
    );
    router.get(
        '/new/:ensName/getNumberOfMessages/:encryptedContactName',
        async (req, res, next) => {
            const encryptedContactName = req.params
                .encryptedContactName as string;

            if (!encryptedContactName) {
                res.status(400).send('invalid schema');
                return;
            }
            try {
                const ensName = normalizeEnsName(req.params.ensName);
                const messages = await db.getNumberOfMessages(
                    ensName,
                    encryptedContactName,
                );
                return res.json(messages);
            } catch (e) {
                next(e);
            }
        },
    );

    router.post('/new/:ensName/addConversation', async (req, res, next) => {
        const { encryptedContactName, encryptedProfileLocation } = req.body;
        if (!encryptedContactName) {
            res.status(400).send('invalid schema');
            return;
        }

        //Param encryptedProfileLocation is optional, hence the default value is an empty string
        const _encryptedProfileLocation = encryptedProfileLocation || '';
        try {
            const ensName = normalizeEnsName(req.params.ensName);
            const success = await db.addConversation(
                ensName,
                encryptedContactName,
                _encryptedProfileLocation,
            );
            if (success) {
                return res.sendStatus(200);
            }
            res.status(400).send('unable to add conversation');
        } catch (e) {
            next(e);
        }
    });
    router.get('/new/:ensName/getConversations', async (req, res, next) => {
        try {
            const ensName = normalizeEnsName(req.params.ensName);

            const pageSize =
                parseInt(req.query.pageSize as string) ||
                DEFAULT_CONVERSATION_PAGE_SIZE;
            const offset = parseInt(req.query.offset as string) || 0;

            const schemaIsValid = validateSchema(PaginatedRequest, {
                pageSize,
                offset,
            });

            if (!schemaIsValid) {
                res.status(400).send('invalid schema');
                return;
            }

            const conversations = await db.getConversationList(
                ensName,
                pageSize,
                offset,
            );
            return res.json(conversations);
        } catch (e) {
            next(e);
        }
    });
    router.get(
        '/new/:ensName/getNumberOfConversations',
        async (req, res, next) => {
            try {
                const ensName = normalizeEnsName(req.params.ensName);
                const messages = await db.getNumberOfConverations(ensName);
                return res.json(messages);
            } catch (e) {
                next(e);
            }
        },
    );

    router.get('/new/:ensName/getHaltedMessages', async (req, res, next) => {
        try {
            const ensName = normalizeEnsName(req.params.ensName);
            const messages = await db.getHaltedMessages(ensName);
            return res.json(messages);
        } catch (err) {
            next(err);
        }
    });

    router.post('/new/:ensName/clearHaltedMessage', async (req, res, next) => {
        try {
            const { messageId, aliasName } = req.body;

            if (!messageId) {
                res.status(400).send('invalid schema');
                return;
            }

            const ensName = normalizeEnsName(req.params.ensName);

            const success = await db.clearHaltedMessage(
                ensName,
                //If the aliasName is not provided, we use the ensName as the client has no intention to use an alias
                aliasName,
                messageId,
            );

            if (success) {
                return res.sendStatus(200);
            }
            res.status(400).send('unable to clear halted message');
        } catch (err) {
            console.error('clearHaltedMessage error');
            console.error(err);
            next(err);
        }
    });

    router.post(
        '/new/:ensName/toggleHideConversation',
        async (req, res, next) => {
            const { encryptedContactName, hide } = req.body;
            if (!encryptedContactName) {
                res.status(400).send('invalid schema');
                return;
            }
            try {
                const ensName = normalizeEnsName(req.params.ensName);

                await db.toggleHideConversation(
                    ensName,
                    encryptedContactName,
                    hide,
                );
                return res.sendStatus(200);
            } catch (e) {
                return res
                    .status(400)
                    .send('unable to toggle hide-conversation');
            }
        },
    );

    return router;
};
