import { getUserProfile, submitUserProfile } from '@dm3-org/dm3-lib-delivery';
import { normalizeEnsName, schema } from '@dm3-org/dm3-lib-profile';
import { validateSchema } from '@dm3-org/dm3-lib-shared';
import { ethers } from 'ethers';
import express from 'express';
import { IDatabase } from '../persistence/getDatabase';

export const Profile = (
    db: IDatabase,
    web3Provider: ethers.providers.JsonRpcProvider,
    luksoProvider: ethers.providers.JsonRpcProvider,
    serverSecret: string,
) => {
    const router = express.Router();

    router.get('/:ensName', async (req: express.Request, res, next) => {
        try {
            const ensName = normalizeEnsName(req.params.ensName);

            //use the webProvider to resolve the address here
            const address = await web3Provider.resolveName(ensName);
            if (!address) {
                const message = `could not get profile for ${ensName}. Unable to resolve address`;
                console.error(message);
                return res.status(400).send({ message });
            }

            const profile = await getUserProfile(
                db.getAccount,
                ethers.utils.getAddress(address),
            );
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
            //use the webProvider to resolve the address here
            const address = await web3Provider.resolveName(ensName);
            if (!address) {
                const message = `could not submit profile for ${ensName}. Unable to resolve address`;
                console.error(message);
                return res.status(400).send({ message });
            }

            console.debug(
                `create profile for ${ensName} with address ${address}`,
            );

            const data = await submitUserProfile(
                luksoProvider,
                db.getAccount,
                db.setAccount,
                //use normalized address
                ethers.utils.getAddress(address),
                req.body,
                serverSecret,
            );
            console.debug({
                message: 'POST profile',
                ensName,
                data,
            });

            res.json(data);
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
