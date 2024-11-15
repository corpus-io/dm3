import { PrismaClient } from '@prisma/client';
import { getOrCreateAccount } from './utils/getOrCreateAccount';
import { getOrCreateConversation } from './utils/getOrCreateConversation';
import { MessageRecord } from './dto/MessageRecord';

export const addMessageBatch =
    (db: PrismaClient) =>
    async (
        ensName: string,
        encryptedContactName: string,
        messageBatch: MessageRecord[],
    ) => {
        try {
            const account = await getOrCreateAccount(db, ensName);

            //Get the target conversation
            const conversation = await getOrCreateConversation(
                db,
                account.id,
                encryptedContactName,
            );

            const uniqueMessageBatch = messageBatch.filter(
                (message, index, self) =>
                    index ===
                    self.findIndex((m) => m.messageId === message.messageId),
            );

            //store each message in the db
            const createMessagePromises = uniqueMessageBatch.map(
                ({
                    messageId,
                    createdAt,
                    encryptedEnvelopContainer,
                    isHalted,
                }) => {
                    //The database stores the date as an ISO 8601 string. Hence we need to convert it to a Date object
                    const createAtDate = new Date(createdAt);
                    return db.encryptedMessage.create({
                        data: {
                            ownerId: account.id,
                            id: messageId,
                            createdAt: createAtDate,
                            conversationId: conversation.id,
                            encryptedContactName,
                            encryptedEnvelopContainer,
                            isHalted,
                        },
                    });
                },
            );

            //Execute all the promises in parallel
            await db.$transaction(createMessagePromises);

            //Update the conversation updatedAt field
            await db.conversation.update({
                where: {
                    id: conversation.id,
                },
                data: {
                    updatedAt: new Date(),
                },
            });

            return true;
        } catch (e) {
            console.log('addMessageBatch error ', e);
            return false;
        }
    };
