import { DeliveryServiceProperties } from '@dm3-org/dm3-lib-delivery';
import express from 'express';
import { IDatabase } from './persistence/getDatabase';
import { IntervalMetric } from './persistence/metrics/metricTypes';

/**
 * The metrics endpoint returns the metrics of the delivery service.
 * These can include the number of messages received, the cumulative size of messages received, etc.,
 * over a certain period of time.
 * @param db The database object.
 */
export default (
    db: IDatabase,
    deliveryServiceProperties: DeliveryServiceProperties,
) => {
    const router = express.Router();
    router.get('', async (req, res) => {
        const metrics: IntervalMetric[] = await db.getMetrics(
            deliveryServiceProperties,
        );

        if (metrics.length === 0) {
            return res.status(204).send('No metrics data available');
        }

        // Convert metrics to CSV format
        const headers = Object.keys(metrics[0]);
        const csvRows = metrics.map((metric) =>
            headers
                .map((header) => metric[header as keyof IntervalMetric])
                .join(','),
        );

        const csvData = [headers.join(','), ...csvRows].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        // res.setHeader(
        //     'Content-Disposition',
        //     'attachment; filename=metrics.csv',
        // );
        return res.status(200).send(csvData);
    });

    return router;
};
