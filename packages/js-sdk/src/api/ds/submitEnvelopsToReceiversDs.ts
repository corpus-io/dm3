import { DispatchableEnvelop } from '@dm3-org/dm3-lib-messaging';
import axios from 'axios';

export const submitEnvelopsToReceiversDs = async (
    envelops: DispatchableEnvelop[],
) => {
    //Every DispatchableEnvelop is sent to the delivery service
    await Promise.all(
        envelops.map(async (envelop) => {
            return await axios
                .create({ baseURL: envelop.deliveryServiceUrl })
                .post('/rpc', {
                    jsonrpc: '2.0',
                    method: 'dm3_submitMessage',
                    params: [JSON.stringify(envelop.encryptedEnvelop)],
                });
        }),
    );
};
