import { stringify } from 'dm3-lib-shared/dist.backend';
import express from 'express';

export function handleGetDeliveryServiceProperties(
    req: express.Request,
    res: express.Response,
) {
    const response = req.app.locals.deliveryServiceProperties;

    if (!response) {
        req.app.locals.logger.error({
            method: 'RPC GET DELIVERY SERVICE PROPERTIES',
            error: 'No Delivery Service Properties Set',
        });
        return res.status(400).send({
            jsonrpc: '2.0',
            result: 'No Delivery Service Properties Set',
        });
    }

    return res
        .status(200)
        .send({ jsonrpc: '2.0', result: stringify(response) });
}
