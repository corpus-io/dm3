import * as Lib from 'dm3-lib/dist.backend';
import { Signer } from 'ethers';
import express from 'express';
import { WithLocals } from './types';

export function ccipGateway(signer: Signer, resolverAddr: string) {
    const router = express.Router();

    router.post(
        '/',
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

            const profileIsValid = Lib.account.checkUserProfile(
                signedUserProfile,
                address,
            );

            //Check if profile sig is correcet
            if (!profileIsValid) {
                return res.status(400).send({ error: 'invalid profile' });
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
            );

            return res.send(200);
        },
    );

    router.get(
        '/:resolverAddr/:calldata',
        async (
            req: express.Request & { app: WithLocals },
            res: express.Response,
        ) => {
            const { resolverAddr, calldata } = req.params;
            //TODO should we blackist all request that are not orignated from our dm3 resolver? CC@Heiko
            try {
                const { record, name, signature } =
                    Lib.offchainResolver.decodeCalldata(calldata);

                if (record !== 'dm3.profile') {
                    return res.status(400).send({
                        message: `Record is not supported by this resolver`,
                    });
                }

                //Todo get rid of unused onchain userprofile
                const profile = await req.app.locals.db.getUserProfile(name);

                if (!profile) {
                    return res
                        .status(404)
                        .send({ message: 'Profile not found' });
                }

                const data = await Lib.offchainResolver.encodeUserProfile(
                    signer,
                    profile,
                    resolverAddr,
                    calldata,
                    signature,
                );

                return res.send({ data });
            } catch (e) {
                return res.status(400).send({ message: 'Unknown error' });
            }
        },
    );
    return router;
}
