import { PrismaClient } from '@prisma/client';
import { getOrCreateAccount } from './utils/getOrCreateAccount';
import { getOrCreateConversation } from './utils/getOrCreateConversation';
export const addConversation =
    (db: PrismaClient) =>
    async (
        ensName: string,
        contactName: string,
        encryptedContactTLDName: string,
    ) => {
        try {
            const account = await getOrCreateAccount(db, ensName);
            await getOrCreateConversation(
                db,
                account.id,
                contactName,
                encryptedContactTLDName,
            );
            return true;
        } catch (e) {
            console.log('addConversation error ', e);
            return false;
        }
    };
