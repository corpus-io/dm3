import { stringify } from '@dm3-org/dm3-lib-shared';
import express from 'express';
import { DeliveryServiceProperties } from '@dm3-org/dm3-lib-delivery';
export function handleGetDeliveryServiceProperties(
    req: express.Request,
    res: express.Response,
    deliveryServiceProperties: DeliveryServiceProperties,
) {
    if (!deliveryServiceProperties) {
        console.error(
            'RPC GET DELIVERY SERVICE PROPERTIES: No Delivery Service Properties Set',
        );
        return res.status(400).send({
            jsonrpc: '2.0',
            result: 'No Delivery Service Properties Set',
        });
    }

    return res
        .status(200)
        .send({ jsonrpc: '2.0', result: stringify(deliveryServiceProperties) });
}
