import { Redis, IDatabase, getRedisClient, getDatabase } from '../getDatabase';
import { UserProfile } from '@dm3-org/dm3-lib-profile';
import { Account } from '@dm3-org/dm3-lib-delivery';

const USER_ADDRESS = '0x25A643B6e52864d0eD816F1E43c0CF49C83B8292';

describe('Set Account', () => {
    let redisClient: Redis;
    let db: IDatabase;

    beforeEach(async () => {
        redisClient = await getRedisClient();
        db = await getDatabase(redisClient);
        await redisClient.flushDb();
    });

    afterEach(async () => {
        await redisClient.flushDb();
        await redisClient.disconnect();
    });

    it('Creates a new Account ', async () => {
        const profile: UserProfile = {
            publicEncryptionKey: '',
            publicSigningKey: '',
            deliveryServices: [],
        };
        const account: Account = {
            account: USER_ADDRESS,
            signedUserProfile: { profile, signature: 'foo' },
            token: '',
            createdAt: 0,
            profileExtension: {
                notSupportedMessageTypes: [],
            },
        };

        const priorSetAccount = await db.getAccount(USER_ADDRESS);
        //User has no account yet
        expect(priorSetAccount).toBe(null);
        await db.setAccount(USER_ADDRESS, account);

        const afterSetAccount = await db.getAccount(USER_ADDRESS);
        //User has no account yet
        expect(afterSetAccount?.signedUserProfile).toEqual({
            profile,
            signature: 'foo',
        });
    });
    it('Creates a new Account and uses normalized address', async () => {
        const profile: UserProfile = {
            publicEncryptionKey: '',
            publicSigningKey: '',
            deliveryServices: [],
        };
        const account: Account = {
            // Address is not normalized
            account: USER_ADDRESS.toUpperCase(),
            signedUserProfile: { profile, signature: 'foo' },
            token: '',
            createdAt: 0,
            profileExtension: {
                notSupportedMessageTypes: [],
            },
        };

        const priorSetAccount = await db.getAccount(USER_ADDRESS);
        //User has no account yet
        expect(priorSetAccount).toBe(null);
        await db.setAccount(USER_ADDRESS, account);

        const afterSetAccount = await db.getAccount(USER_ADDRESS);
        //User has no account yet
        expect(afterSetAccount?.signedUserProfile).toEqual({
            profile,
            signature: 'foo',
        });
    });

    it('Rejects account with an invalid address', async () => {
        const profile: UserProfile = {
            publicEncryptionKey: '',
            publicSigningKey: '',
            deliveryServices: [],
        };
        const account: Account = {
            account: USER_ADDRESS,
            signedUserProfile: {
                profile,
                signature: '',
            },
            token: '',
            createdAt: 0,
            profileExtension: {
                notSupportedMessageTypes: [],
            },
        };
        try {
            await db.setAccount('foo', account);
            fail();
        } catch (e) {
            expect(e).toStrictEqual(Error('Invalid address'));
        }
    });

    it('Rejects account with an invalid schema', async () => {
        const invalidAccount = {} as Account;
        try {
            await db.setAccount('foo', invalidAccount);
            fail();
        } catch (e) {
            expect(e).toStrictEqual(Error('Invalid account'));
        }
    });
});
