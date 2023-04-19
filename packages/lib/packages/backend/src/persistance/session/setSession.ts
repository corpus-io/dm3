import { Redis, RedisPrefix } from '../getDatabase';
import { Session, schema } from 'dm3-lib-delivery/dist.backend';
import { validateSchema, stringify } from 'dm3-lib-shared/dist.backend';
import { normalizeEnsName } from 'dm3-lib-profile/dist.backend';
import { getIdEnsName } from './getIdEnsName';

export function setSession(redis: Redis) {
    return async (ensName: string, session: Session) => {
        const isValid = validateSchema(schema.Session, session);

        if (!isValid) {
            throw Error('Invalid session');
        }
        await redis.set(
            RedisPrefix.Session + (await getIdEnsName(redis)(ensName)),
            stringify(session),
        );
    };
}

export function setAliasSession(redis: Redis) {
    return async (ensName: string, aliasEnsName: string) => {
        await redis.set(
            RedisPrefix.Session + 'alias:' + normalizeEnsName(aliasEnsName),
            normalizeEnsName(ensName),
        );
    };
}
