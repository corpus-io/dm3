import { normalizeEnsName } from '@dm3-org/dm3-lib-profile';
import { validateSchema } from '@dm3-org/dm3-lib-shared';
import cors from 'cors';
import { ethers } from 'ethers';
import express from 'express';
import { IAccountDatabase } from './iAccountDatabase';
import { createChallenge, createNewSessionToken } from './Keys';

const getChallengeSchema = {
    type: 'object',
    properties: {
        ensName: { type: 'string' },
    },
    required: ['ensName'],
    additionalProperties: false,
};

const createNewSessionTokenParamsSchema = {
    type: 'object',
    properties: {
        ensName: { type: 'string' },
    },
    required: ['ensName'],
    additionalProperties: false,
};

const createNewSessionTokenBodySchema = {
    type: 'object',
    properties: {
        signature: { type: 'string' },
        challenge: { type: 'string' },
    },
    required: ['signature', 'challenge'],
    additionalProperties: false,
};

export const Authenticate = (
    db: IAccountDatabase,
    serverSecret: string,
    web3Provider: ethers.providers.JsonRpcProvider,
) => {
    const router = express.Router();

    //TODO remove
    router.use(cors());

    router.get('/:ensName', async (req: express.Request, res, next) => {
        try {
            const idEnsName = normalizeEnsName(req.params.ensName);

            const schemaIsValid = validateSchema(
                getChallengeSchema,
                req.params,
            );

            if (!schemaIsValid) {
                return res.sendStatus(400);
            }

            const challenge = await createChallenge(
                db,
                idEnsName,
                serverSecret,
            );

            res.json(challenge);
        } catch (e) {
            next(e);
        }
    });

    router.post('/:ensName', async (req: express.Request, res, next) => {
        try {
            const idEnsName = await normalizeEnsName(req.params.ensName);
            const paramsAreValid = validateSchema(
                createNewSessionTokenParamsSchema,
                req.params,
            );

            const bodyIsValid = validateSchema(
                createNewSessionTokenBodySchema,
                req.body,
            );

            const schemaIsValid = paramsAreValid && bodyIsValid;

            if (!schemaIsValid) {
                return res.sendStatus(400);
            }

            const jwt = await createNewSessionToken(
                db,
                req.body.signature,
                req.body.challenge,
                idEnsName,
                serverSecret,
                web3Provider,
            );

            res.json(jwt);
        } catch (e) {
            console.error('unable to create new session token ', e);
            return res.status(400).json({
                error:
                    e instanceof Error
                        ? e.message
                        : 'Failed to create new session token',
            });
        }
    });

    return router;
};
