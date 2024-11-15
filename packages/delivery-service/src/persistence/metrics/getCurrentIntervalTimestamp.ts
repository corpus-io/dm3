/**
 * Get the timestamp of the current metrics collection interval.
 * In order to have reproducible interval names, we use the start of the interval. This is defined
 * as the timestamp of the first second of the interval, when counting full intervals from unix epoch.
 * @param collectionIntervalInSeconds the duration over which all metrics are summarized
 * @returns the timestamp of the current interval
 */
export function getCurrentIntervalTimestamp(
    collectionIntervalInSeconds: number,
): string {
    const currentDate = new Date();
    const timestamp =
        Math.floor(currentDate.getTime() / 1000 / collectionIntervalInSeconds) *
        collectionIntervalInSeconds;
    return `${timestamp}`;
}
