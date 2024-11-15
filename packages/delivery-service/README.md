# dm3 delivery service

The delivery service is always online. It receives and stores messages for accounts it knows. It is a simple express server that listens for POST requests and stores the messages, until they are collected by the account owners.

## Getting Started

### Build

```
cd ../../ && yarn build
```

### Usage

yarn

```
yarn start
```

npm

```
npm start
```

## Configuration

### Metrics collection

This delivery service implementation collects these metrics:

-   number of messages received
-   number of notifications sent
-   total size of messages received

These metrics are accumulated over the `metricsCollectionIntervalInSeconds`, which can be defined in the config file and defaults to 1 hour. They are retained for `metricsRetentionDurationInSeconds`, which defaults to 10 days.

The metrics are not sent anywhere, but can be accessed by anyone via the `/metrics` endpoint. This endpoint censors the current collection interval to prevent real-time tracking, which would reduce the privacy of the users.

In order to disable metrics collection, set `metricsRetentionDurationInSeconds` to 0.
