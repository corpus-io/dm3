import { checkSignature } from '@dm3-org/dm3-lib-crypto';
import {
    checkUserProfileWithAddress,
    schema,
    ProfileValidator,
} from '@dm3-org/dm3-lib-profile';
import { validateSchema } from '@dm3-org/dm3-lib-shared';
import { ethers } from 'ethers';
import express from 'express';
import { SiweMessage } from 'siwe';
import { SubdomainManager } from './subdomainManager/SubdomainManager';
import { WithLocals } from './types';

export function profile(
    web3Provider: ethers.providers.BaseProvider,
    luksoProvider: ethers.providers.BaseProvider,
) {
    const router = express.Router();
    //subdomain manager for address domains
    const addressSubdomainManager = new SubdomainManager(
        'RESOLVER_SUPPORTED_ADDR_ENS_SUBDOMAINS',
    );
    //subdomain manager for name domains
    const nameSubdomainManager = new SubdomainManager(
        'RESOLVER_SUPPORTED_NAME_ENS_SUBDOMAINS',
    );

    //Special route for eth prague
    router.post(
        '/nameP',
        //@ts-ignore
        async (req: express.Request & { app: WithLocals }, res, next) => {
            try {
                const { signedUserProfile, siweMessage, siweSig, hotAddr } =
                    req.body;

                let parsedSiwe;
                try {
                    parsedSiwe = JSON.parse(siweMessage);
                } catch (e) {
                    console.error({
                        message: 'Could not parse SIWE JSON string',
                        error: JSON.stringify(e),
                    });
                    return res
                        .status(400)
                        .send({ error: 'Could not parse SIWE JSON string' });
                }

                const siwe = new SiweMessage(parsedSiwe);

                //Get the address that signed the siwe message
                const address = siwe.address;

                // Check if the signature fits to the siwe message
                const verification = await siwe.verify({ signature: siweSig });

                if (!verification.success) {
                    console.error({
                        message: `Invalid siwe sig`,
                        error: verification.error,
                    });
                    return res
                        .status(400)
                        .send({ error: `SIWE verification failed` });
                } else {
                    console.debug({
                        message: `Valid siwe`,
                        data: verification.data,
                    });
                }

                const isSchemaValid = validateSchema(
                    schema.SignedUserProfile,
                    signedUserProfile,
                );

                //Check if schema is valid
                if (!isSchemaValid) {
                    console.warn('invalid schema');
                    return res.status(400).send({ error: 'invalid schema' });
                }

                //Check if the profile was signed by hot wallet address
                const profileIsValid = checkUserProfileWithAddress(
                    signedUserProfile,
                    hotAddr,
                );

                //Check if profile sig is correcet
                if (!profileIsValid) {
                    console.warn('invalid profile');
                    return res.status(400).send({ error: 'invalid profile' });
                }

                //One spam protection
                if (req.app.locals.config.spamProtection) {
                    console.warn('Quota reached');

                    return res.status(400).send({
                        error: 'address has already claimed a subdomain',
                    });
                }
                console.debug({
                    message: 'nameP setAlias',
                    hotAddr: hotAddr + '.addr.devconnect.dm3.eth',
                    alias: `${address}.user.devconnect.dm3.eth`,
                });

                await req.app.locals.db.removeAlias(
                    `${address}.user.devconnect.dm3.eth`,
                );

                await req.app.locals.db.setAlias(
                    hotAddr + '.addr.devconnect.dm3.eth',
                    `${address}.user.devconnect.dm3.eth`,
                );

                return res.sendStatus(200);
            } catch (e) {
                next(e);
            }
        },
    );
    router.post(
        '/name',
        //@ts-ignore
        async (req: express.Request & { app: WithLocals }, res, next) => {
            try {
                const { signature, addressName, dm3Name } = req.body;
                console.log(
                    `register new dm3 name ${dm3Name} for ${addressName}`,
                );

                const profileContainer =
                    await req.app.locals.db.getProfileContainer(addressName);

                // check if there is a profile
                if (!profileContainer) {
                    console.warn('Could not find profile');
                    return res
                        .status(400)
                        .send({ error: 'Could not find profile' });
                }

                //Check if the request comes from the owner of the name
                const sigCheck = await checkSignature(
                    profileContainer.profile.profile.publicSigningKey,
                    'alias: ' + dm3Name,
                    signature,
                );

                if (!sigCheck) {
                    console.warn('signature invalid');

                    return res.status(400).send({
                        error: 'signature invalid',
                    });
                }

                //TODO: One address can only claim one subdomain

                //To avoid spam the user is required to have at least a non-zero balance
                const sendersBalance = await web3Provider.getBalance(
                    profileContainer.address,
                );

                if (
                    req.app.locals.config.spamProtection &&
                    sendersBalance.isZero()
                ) {
                    console.warn('Insuficient ETH balance');
                    return res
                        .status(400)
                        .send({ error: 'Insuficient ETH balance' });
                }

                //ask the subdomain manager if the names subdomain is supported
                if (!nameSubdomainManager.isSubdomainSupported(dm3Name)) {
                    return res.status(400).send({
                        error: `dm3 name ${dm3Name} is not supported. Invalid subdomain`,
                    });
                }

                if (!(await req.app.locals.db.setAlias(addressName, dm3Name))) {
                    return res
                        .status(400)
                        .send({ error: 'Could not create alias' });
                }

                return res.sendStatus(200);
            } catch (e) {
                next(e);
            }
        },
    );
    router.post(
        '/deleteName',
        //@ts-ignore
        async (req: express.Request & { app: WithLocals }, res, next) => {
            try {
                const { signature, dm3Name } = req.body;
                console.log(`remove dm3 name ${dm3Name}`);

                const profileContainer =
                    await req.app.locals.db.getProfileContainerForAlias(
                        dm3Name,
                    );

                // Check if name has a connected address
                if (!profileContainer || !profileContainer.address) {
                    console.warn(`Couldn't get address`);
                    return res
                        .status(400)
                        .send({ error: `Couldn't get address` });
                }

                //Check if the request comes from the owner of the name
                const sigCheck = await checkSignature(
                    profileContainer.profile.profile.publicSigningKey,
                    'remove: ' + dm3Name,
                    signature,
                );
                if (!sigCheck) {
                    console.warn('signature invalid');

                    return res.status(400).send({
                        error: 'signature invalid',
                    });
                }

                (await req.app.locals.db.removeAlias(dm3Name))
                    ? res.sendStatus(200)
                    : res.status(400).send({
                          error: `Couldn't remove profile`,
                      });
            } catch (e) {
                next(e);
            }
        },
    );

    router.post(
        '/address',
        //@ts-ignore
        async (req: express.Request & { app: WithLocals }, res, next) => {
            try {
                const { signedUserProfile, address, subdomain } = req.body;

                const isSchemaValid = validateSchema(
                    schema.SignedUserProfile,
                    signedUserProfile,
                );

                console.log('register new address', address, subdomain);

                //Check if schema is valid
                if (
                    !isSchemaValid ||
                    !ethers.utils.isAddress(address) ||
                    !subdomain
                ) {
                    console.log(req.body);
                    return res.status(400).send({ error: 'invalid schema' });
                }

                //Check if the profile was signed by the owner of the address or an UP
                const profileIsValid = await new ProfileValidator(
                    luksoProvider,
                ).validate(signedUserProfile, address);

                //add check for lukso

                //Check if profile sig is correcet
                if (!profileIsValid) {
                    console.error('profile signature invalid');
                    console.error(signedUserProfile, address);
                    return res.status(400).send({ error: 'invalid profile' });
                }

                const name = `${address}.${subdomain}`;

                //ask the subdomain manager if the names subdomain is supported
                if (!addressSubdomainManager.isSubdomainSupported(name)) {
                    return res.status(400).send({
                        error: `subdomain ${subdomain} is not supported`,
                    });
                }

                await req.app.locals.db.setUserProfile(
                    name,
                    signedUserProfile,
                    address,
                );
                console.info(`Registered ${name}`);

                return res.sendStatus(200);
            } catch (e) {
                next(e);
            }
        },
    );

    router.get(
        '/:address',
        //@ts-ignore
        async (req: express.Request & { app: WithLocals }, res, next) => {
            const { address } = req.params;
            console.info(`GET addr ${address} `);
            if (!ethers.utils.isAddress(address)) {
                return res.status(400).send();
            }

            const hasAddressProfile =
                !!(await req.app.locals.db.getProfileContainerByAddress(
                    address,
                ));

            if (!hasAddressProfile) {
                return res.sendStatus(404);
            }
            const profileContainer =
                await req.app.locals.db.getProfileContainerByAddress(address);
            if (!profileContainer) {
                return res.sendStatus(404);
            }

            return res.status(200).send(profileContainer.profile);
        },
    );

    router.get(
        '/name/:address',
        //@ts-ignore
        async (req: express.Request & { app: WithLocals }, res) => {
            const { address } = req.params;
            console.info(`GET name for ${address} `);
            if (!ethers.utils.isAddress(address)) {
                return res.status(400).send();
            }

            const alias = await req.app.locals.db.getProfileAliasByAddress(
                address,
            );

            return alias
                ? res.status(200).send({ name: alias })
                : res.status(404).send();
        },
    );
    return router;
}
