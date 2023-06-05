import { Axios } from 'axios';
import { logError } from 'dm3-lib-shared';

interface RpcRequest {
    axios: Axios;
    method: string;
    params: string[];
}

interface RpcResponse<T> {
    jsonrpc: string;
    id: string;
    result: T;
    error?: { code: number; message: string; data?: any };
}

export async function makeRpcRequest<T>({
    axios,
    method,
    params,
}: RpcRequest): Promise<T | null> {
    const url = `/rpc`;

    const body = {
        jsonrpc: '2.0',
        method,
        params,
    };

    const { data } = await axios.post<RpcResponse<T>>(url, body);

    const { error, result } = data;

    if (error) {
        logError({ text: '[makeRpcRequest] ', error });
        return null;
    }
    return result;
}
