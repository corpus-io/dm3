import { getMetrics } from './getMetrics';
import type { IntervalMetric } from './metricTypes';
import { countMessage, countNotification } from './setMetrics';

export default {
    getMetrics,
    countMessage,
    countNotification,
};

export type { IntervalMetric };
