import { DeliveryServiceProfile } from '@dm3-org/dm3-lib-profile';
import { log } from '@dm3-org/dm3-lib-shared';
import axios from 'axios';

export const fetchMessageSizeLimit = async (
    deliveryServiceProfile: DeliveryServiceProfile[],
) => {
    try {
        const sizeLimits = await Promise.all(
            deliveryServiceProfile.map(async (ds) => {
                const res = await axios
                    .create({ baseURL: ds.url })
                    .post('/rpc', {
                        jsonrpc: '2.0',
                        method: 'dm3_getDeliveryServiceProperties',
                        params: [],
                    });

                return res.data.result;
            }),
        );

        //Find the lowest size limit
        return sizeLimits.reduce((acc, limit) => {
            if (acc === 0) {
                return limit;
            }
            return limit < acc ? limit : acc;
        }, 0);
    } catch (error) {
        log('contact has no profile', 'info');
        return 0;
    }
};
