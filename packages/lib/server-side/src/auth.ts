import {
    createChallenge,
    createNewSessionToken,
} from '@dm3-org/dm3-lib-delivery';
import { normalizeEnsName } from '@dm3-org/dm3-lib-profile';
import { validateSchema } from '@dm3-org/dm3-lib-shared';
import cors from 'cors';
import express from 'express';

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

//@ts-ignore
export const Auth = (getSession, serverSecret: string) => {
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
                return res.send(400);
            }

            const challenge = await createChallenge(
                getSession,
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
                return res.send(400);
            }

            const jwt = await createNewSessionToken(
                getSession,
                req.body.signature,
                req.body.challenge,
                idEnsName,
                serverSecret,
            );

            res.json(jwt);
        } catch (e) {
            next(e);
            console.error('unable to create new session token ', e);
        }
    });

    return router;
};
