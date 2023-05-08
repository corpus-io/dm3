import axios, { AxiosResponse } from 'axios';
import { EncryptionEnvelop } from 'dm3-lib-messaging';
import { log } from 'dm3-lib-shared';

/**
 * Retrieves incoming messages for a specific ENS name.
 *
 * @param {string} ensName - The ENS name for which to retrieve incoming messages.
 * @returns {Promise<IncomingMessage[]>} - A promise that resolves with the array of incoming messages.
 */
export async function getIncomingMessages(
    dsUrl: string,
    ensName: string,
): Promise<EncryptionEnvelop[] | null> {
    try {
        const response: AxiosResponse<EncryptionEnvelop[]> = await axios.get(
            `${dsUrl}/messages/incoming/${ensName}`,
        );

        return response.data;
    } catch (e) {
        log(`Failed to retrieve incoming messages for ds ${dsUrl}`);
        return null;
    }
}
