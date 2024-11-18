import { generateAuthJWT } from '@dm3-org/dm3-lib-server-side';
import {
    getUserProfile,
    ProfileValidator,
    SignedUserProfile,
} from '@dm3-org/dm3-lib-profile';

import {
    checkUserProfile,
    normalizeEnsName,
    schema,
} from '@dm3-org/dm3-lib-profile';
import { validateSchema } from '@dm3-org/dm3-lib-shared';
import { ethers } from 'ethers';
import express from 'express';
import { IBackendDatabase } from '../persistence/getDatabase';

export default (
    db: IBackendDatabase,
    web3Provider: ethers.providers.JsonRpcProvider,
    luksoProvider: ethers.providers.JsonRpcProvider,
    serverSecret: string,
) => {
    const router = express.Router();

    router.get('/:ensName', async (req: express.Request, res, next) => {
        try {
            const ensName = normalizeEnsName(req.params.ensName);

            const profile = await getUserProfile(web3Provider, ensName);
            if (profile) {
                res.json(profile);
            } else {
                res.sendStatus(404);
            }
        } catch (e) {
            next(e);
        }
    });

    /**
     * Creates a new profile for the given ensName
     * @param ensName ens id of the account
     * @param signedUserProfile signed user profile
     */
    router.post('/:ensName', async (req: express.Request, res, next) => {
        try {
            const schemaIsValid = validateSchema(
                schema.SignedUserProfile,
                req.body,
            );

            if (!schemaIsValid) {
                console.error({ message: 'invalid schema' });
                return res.status(400).send({ error: 'invalid schema' });
            }
            const ensName = normalizeEnsName(req.params.ensName);
            console.debug({
                method: 'POST',
                url: req.url,
                ensName,
            });

            // check if profile and signature are valid
            if (
                !(await checkUserProfile(
                    web3Provider,
                    luksoProvider,
                    req.body, // as SignedUserProfile,
                    normalizeEnsName(ensName),
                ))
            ) {
                console.debug(
                    'Not creating account for ' +
                        ensName +
                        '  - Signature invalid',
                );
                throw Error('Signature invalid.');
            }

            // check if an account for this name already exists
            if (await db.getAccount(ensName)) {
                console.debug(
                    'Not creating account for ' +
                        ensName +
                        ' - account exists already',
                );
                throw Error('Account exists already');
            }

            // create account
            const account = await db.setAccount(ensName);
            console.debug({
                message: 'POST profile',
                ensName,
                account,
            });

            // generate auth jwt
            const token = generateAuthJWT(ensName, serverSecret);

            res.json(token);
        } catch (e) {
            console.warn({
                message: 'POST profile',
                error: JSON.stringify(e),
            });
            // eslint-disable-next-line no-console
            console.log('POST PROFILE ERROR', e);
            res.status(400).send({
                message: `Couldn't store profile`,
                error: JSON.stringify(e),
            });
        }
    });

    return router;
};
