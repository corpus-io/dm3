import { UserProfile } from '@dm3-org/dm3-lib-profile';
import { PrismaClient } from '@prisma/client';
import {
    IBackendDatabase,
    getDatabase,
    getPrismaClient,
} from '../../getDatabase';

const USER_NAME = '0x25A643B6e52864d0eD816F1E43c0CF49C83B8292.dm3.eth';

describe('Set Account', () => {
    let prismaClient: PrismaClient;
    let db: IBackendDatabase;

    beforeEach(async () => {
        prismaClient = await getPrismaClient();
        db = await getDatabase(prismaClient);
    });

    it('Creates a new Account ', async () => {
        const priorSetAccount = await db.getAccount(USER_NAME);

        //User has no account yet
        expect(priorSetAccount).toBe(null);
        await db.setAccount(USER_NAME);

        const afterSetAccount = await db.getAccount(USER_NAME);
        //User has no account yet
        expect(afterSetAccount?.id).toEqual(USER_NAME);
    });
});
