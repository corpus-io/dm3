import { Axios } from 'axios';
import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import http from 'http';
import path from 'path';
import { Server } from 'socket.io';
import winston from 'winston';
import { startCleanUpPendingMessagesJob } from './cleanup/cleanUpPendingMessages';
import { getDeliveryServiceProperties } from './config/getDeliveryServiceProperties';
import Delivery from './delivery';
import { onConnection } from './messaging';
import { getDatabase } from './persistence/getDatabase';
import Profile from './profile';
import RpcProxy from './rpc/rpc-proxy';
import { logInfo } from '@dm3-org/dm3-lib-shared';
import 'dotenv/config';

import {
    errorHandler,
    getWeb3Provider,
    logError,
    logRequest,
    readKeysFromEnv,
    socketAuth,
} from '@dm3-org/dm3-lib-server-side';
import Notifications from './notifications';

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb' }));

const server = http.createServer(app);

//TODO remove
app.use(cors());
app.use(bodyParser.json());

declare global {
    var logger: winston.Logger;
}

global.logger = winston.createLogger({
    level: process.env.LOG_LEVEL ?? 'info',
    transports: [new winston.transports.Console()],
});

(async () => {
    const io = new Server(server, {
        cors: {
            origin: '*',
            methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
            preflightContinue: false,
            optionsSuccessStatus: 204,
        },
    });

    const deliveryServiceProperties = getDeliveryServiceProperties();

    const db = await getDatabase();
    const web3Provider = await getWeb3Provider(process.env);

    app.use(logRequest);

    app.get('/hello', (req, res) => {
        return res.send('Hello DM3');
    });

    /**
     *     needed
     */
    app.use('/profile', Profile());
    app.use('/delivery', Delivery());
    app.use(
        '/notifications',
        Notifications(deliveryServiceProperties, db, web3Provider),
    );
    app.use(logError);
    app.use(errorHandler);
    io.use(socketAuth(db, web3Provider));
    io.on('connection', onConnection(app, io));
    startCleanUpPendingMessagesJob(db, deliveryServiceProperties.messageTTL);
    app.use('/rpc', RpcProxy(new Axios({ url: process.env.RPC })));
})();

// TODO include standalone web app
app.use(express.static(path.join(__dirname, '../../web/build')));
const port = process.env.PORT || '8080';

server.listen(port, () => {
    logInfo({
        text: '[Server] listening',
        port,
        dir: __dirname,
    });
});
