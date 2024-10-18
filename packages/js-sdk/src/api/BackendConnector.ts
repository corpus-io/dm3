import { normalizeEnsName } from '@dm3-org/dm3-lib-profile';
import { IBackendConnector } from '@dm3-org/dm3-lib-shared';
import { ServerSideConnector } from './ServerSideConnector';

export class BackendConnector
    extends ServerSideConnector
    implements IBackendConnector
{
    public async addConversation(
        ensName: string,
        encryptedContactName: string,
        encryptedProfileLocation: string,
    ) {
        const url = `/storage/new/${normalizeEnsName(ensName)}/addConversation`;
        await this.getAuthenticatedAxiosClient().post(url, {
            encryptedContactName,
            encryptedProfileLocation,
        });
    }
    public async getConversations(
        ensName: string,
        pageSize: number,
        offset: number,
    ) {
        const url = `/storage/new/${normalizeEnsName(
            ensName,
        )}/getConversations`;
        const axios = this.getAuthenticatedAxiosClient();

        const { data } = await axios.get(url, {
            params: {
                pageSize,
                offset,
            },
        });
        return data ?? [];
    }
    public async toggleHideConversation(
        ensName: string,
        encryptedContactName: string,
        hide: boolean,
    ) {
        const url = `/storage/new/${normalizeEnsName(
            ensName,
        )}/toggleHideConversation`;
        await this.getAuthenticatedAxiosClient().post(url, {
            encryptedContactName,
            hide,
        });
    }
    public async getMessagesFromStorage(
        ensName: string,
        encryptedContactName: string,
        pageSize: number,
        offset: number,
    ) {
        const url = `/storage/new/${normalizeEnsName(
            ensName,
        )}/getMessages/${encryptedContactName}`;

        const { data } = await this.getAuthenticatedAxiosClient().get(url, {
            params: {
                pageSize,
                offset,
            },
        });

        return (
            data.map((message: any) => {
                return JSON.parse(message);
            }) ?? []
        );
    }

    public async getHaltedMessages(ensName: string) {
        const url = `/storage/new/${normalizeEnsName(
            ensName,
        )}/getHaltedMessages/`;
        const { data } = await this.getAuthenticatedAxiosClient().get(url, {});
        return data ?? [];
    }
    public async clearHaltedMessages(
        ensName: string,
        messageId: string,
        aliasName: string,
    ) {
        const url = `/storage/new/${normalizeEnsName(
            ensName,
        )}/clearHaltedMessage/`;
        const { data } = await this.getAuthenticatedAxiosClient().post(url, {
            aliasName,
            messageId,
        });
        return data ?? [];
    }

    public async addMessage(
        ensName: string,
        encryptedContactName: string,
        messageId: string,
        createdAt: number,
        encryptedEnvelopContainer: string,
        isHalted: boolean,
    ) {
        const url = `/storage/new/${normalizeEnsName(ensName)}/addMessage`;
        await this.getAuthenticatedAxiosClient().post(url, {
            encryptedContactName,
            messageId,
            createdAt,
            encryptedEnvelopContainer,
            isHalted,
        });
    }

    public async addMessageBatch(
        ensName: string,
        encryptedContactName: string,
        messageBatch: any[],
    ) {
        const url = `/storage/new/${normalizeEnsName(ensName)}/addMessageBatch`;
        const { status } = await this.getAuthenticatedAxiosClient().post(url, {
            encryptedContactName,
            messageBatch,
        });
        if (status !== 200) {
            throw Error('Unable to edit message batch');
        }
    }

    public async editMessageBatch(
        ensName: string,
        encryptedContactName: string,
        editMessageBatchPayload: any[],
    ) {
        const url = `/storage/new/${normalizeEnsName(
            ensName,
        )}/editMessageBatch`;
        await this.getAuthenticatedAxiosClient().post(url, {
            encryptedContactName,
            editMessageBatchPayload,
        });
    }
    public async getNumberOfMessages(
        ensName: string,
        encryptedContactName: string,
    ) {
        const url = `/storage/new/${normalizeEnsName(
            ensName,
        )}/getNumberOfMessages/${encryptedContactName}`;
        const { data } = await this.getAuthenticatedAxiosClient().get(url);
        return data ?? 0;
    }

    public async getNumberOfConversations(ensName: string) {
        const url = `/storage/new/${normalizeEnsName(
            ensName,
        )}/getNumberOfConversations`;
        const { data } = await this.getAuthenticatedAxiosClient().get(url);
        return data ?? 0;
    }
}
