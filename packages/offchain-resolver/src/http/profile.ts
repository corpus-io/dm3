import * as Lib from 'dm3-lib/dist.backend';
import { ethers } from 'ethers';
import express from 'express';
import { WithLocals } from './types';

export function profile(web3Provider: ethers.providers.BaseProvider) {
    const router = express.Router();

    router.post(
        '/name',
        async (req: express.Request & { app: WithLocals }, res, next) => {
            const { signedUserProfile, name, address } = req.body;
            const isSchemaValid = Lib.validateSchema(
                Lib.account.schema.SignedUserProfile,
                signedUserProfile,
            );

            //Check if schema is valid
            if (!isSchemaValid) {
                return res.status(400).send({ error: 'invalid schema' });
            }

            const profileIsValid = Lib.account.checkUserProfileWithAddress(
                signedUserProfile,
                address,
            );

            //Check if profile sig is correcet
            if (!profileIsValid) {
                return res.status(400).send({ error: 'invalid profile' });
            }

            const hasAddressProfile = await req.app.locals.db.hasAddressProfile(
                address,
            );

            //One address can only claim one subdomain
            if (hasAddressProfile) {
                return res
                    .status(400)
                    .send({ error: 'address has already claimed a subdomain' });
            }

            //The /address endpoint has to be used to create an subdomain based on a address
            const nameIsAddress = ethers.utils.isAddress(name.split('.')[0]);

            if (nameIsAddress) {
                return res.status(400).send({
                    error: 'Invalid ENS name',
                });
            }
            const sendersBalance = await web3Provider.getBalance(address);

            //To avoid spam the user is required to have at least a non-zero balance
            if (sendersBalance.isZero()) {
                return res
                    .status(400)
                    .send({ error: 'Insuficient ETH balance' });
            }

            const profileExists = await req.app.locals.db.getUserProfile(name);

            if (profileExists) {
                return res
                    .status(400)
                    .send({ error: 'subdomain already claimed' });
            }
            await req.app.locals.db.setUserProfile(
                name,
                signedUserProfile.profile,
                address,
            );

            return res.sendStatus(200);
        },
    );
    router.post(
        '/address',
        async (req: express.Request & { app: WithLocals }, res, next) => {
            const { signedUserProfile, address } = req.body;
            const isSchemaValid = Lib.validateSchema(
                Lib.account.schema.SignedUserProfile,
                signedUserProfile,
            );

            //Check if schema is valid
            if (!isSchemaValid) {
                return res.status(400).send({ error: 'invalid schema' });
            }

            const profileIsValid = Lib.account.checkUserProfileWithAddress(
                signedUserProfile,
                address,
            );

            //Check if profile sig is correcet
            if (!profileIsValid) {
                return res.status(400).send({ error: 'invalid profile' });
            }

            const hasAddressProfile = await req.app.locals.db.hasAddressProfile(
                address,
            );

            //One address can only claim one subdomain
            if (hasAddressProfile) {
                return res
                    .status(400)
                    .send({ error: 'address has already claimed a subdomain' });
            }

            const name = `${address}.dev-addr.dm3.eth`;

            const profileExists = await req.app.locals.db.getUserProfile(name);

            if (profileExists) {
                return res
                    .status(400)
                    .send({ error: 'subdomain already claimed' });
            }

            await req.app.locals.db.setUserProfile(
                name,
                signedUserProfile.profile,
                address,
            );

            Lib.log(`Registered ${name}`);

            return res.sendStatus(200);
        },
    );

    router.get(
        '/:address',
        async (req: express.Request & { app: WithLocals }, res, next) => {
            const { address } = req.params;
            if (!ethers.utils.isAddress(address)) {
                return res.status(400).send();
            }

            const hasAddressProfile = await req.app.locals.db.hasAddressProfile(
                address,
            );

            if (!hasAddressProfile) {
                return res.send(404);
            }
            const userProfile = await req.app.locals.db.getUserProfileByAddress(
                address,
            );
            if (!userProfile) {
                return res.send(404);
            }

            return res.status(200).send(userProfile);
        },
    );
    return router;
}
