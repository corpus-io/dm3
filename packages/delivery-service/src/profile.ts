import { getUserProfile, submitUserProfile } from '@dm3-org/dm3-lib-delivery';
import { normalizeEnsName, schema } from '@dm3-org/dm3-lib-profile';
import { validateSchema } from '@dm3-org/dm3-lib-shared';
import express from 'express';

export default () => {
    const router = express.Router();

    router.get(
        '/:ensName',
        //@ts-ignore
        async (req: express.Request, res, next) => {
            try {
                const ensName = normalizeEnsName(req.params.ensName);

                const profile = await getUserProfile(
                    req.app.locals.db.getSession,
                    ensName,
                );
                if (profile) {
                    res.json(profile);
                } else {
                    res.sendStatus(404);
                }
            } catch (e) {
                next(e);
            }
        },
    );

    router.post(
        '/:ensName',
        //@ts-ignore
        async (req: express.Request, res, next) => {
            try {
                const schemaIsValid = validateSchema(
                    schema.SignedUserProfile,
                    req.body,
                );

                if (!schemaIsValid) {
                    global.logger.error({ message: 'invalid schema' });
                    return res.status(400).send({ error: 'invalid schema' });
                }
                const ensName = normalizeEnsName(req.params.ensName);
                global.logger.debug({
                    method: 'POST',
                    url: req.url,
                    ensName,
                    disableSessionCheck:
                        process.env.DISABLE_SESSION_CHECK === 'true',
                });

                const data = await submitUserProfile(
                    req.app.locals.web3Provider,
                    req.app.locals.db.getSession,
                    req.app.locals.db.setSession,
                    ensName,
                    req.body,
                    (ensName: string) => req.app.locals.db.getPending(ensName),
                    (socketId: string) =>
                        req.app.locals.io.sockets.to(socketId).emit('joined'),
                );
                global.logger.debug({
                    message: 'POST profile',
                    ensName,
                    data,
                });

                res.json(data);
            } catch (e) {
                global.logger.warn({
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
        },
    );

    return router;
};
