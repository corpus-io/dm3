import { Account } from '@dm3-org/dm3-lib-delivery';
import {
    Authenticate,
    errorHandler,
    getCachedWebProvider,
    getLuksoProvider,
    getServerSecret,
    logError,
    logRequest,
    readKeysFromEnv,
} from '@dm3-org/dm3-lib-server-side';
import { NotificationChannelType, logInfo } from '@dm3-org/dm3-lib-shared';
import { Axios } from 'axios';
import bodyParser from 'body-parser';
import cors from 'cors';
import 'dotenv/config';
import { ethers } from 'ethers';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import webpush from 'web-push';
import { startCleanUpPendingMessagesJob } from './cleanup/cleanUpPendingMessages';
import { getDeliveryServiceProperties } from './config/getDeliveryServiceProperties';
import Delivery from './delivery';
import { onConnection } from './messaging';
import Metrics from './metrics';
import Notifications from './notifications';
import { IDatabase, getDatabase } from './persistence/getDatabase';
import { Profile } from './profile/profile';
import RpcProxy from './rpc/rpc-proxy';
import { socketAuth } from './socketAuth';
import { WebSocketManager } from './ws/WebSocketManager';

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb' }));

const server = http.createServer(app);

// On the delivery-service side the address functions as an identifier for the account.
// The reason for that is that the DS should accept all messages directet to the address. Regardless of its ENS name.
// To use as much shared code as possible from lib/server-side the address is resolved to the account before each database call.
// using this wrapper around the IDatabase
const getDbWithAddressResolvedGetAccount = (
    db: IDatabase,
    web3Provider: ethers.providers.JsonRpcProvider,
): IDatabase => {
    const getAccountForEnsName = (
        web3Provider: ethers.providers.JsonRpcProvider,
        getAccount: (ensName: string) => Promise<Account | null>,
    ) => {
        return async (ensName: string) => {
            const address = await web3Provider.resolveName(ensName);
            console.debug(
                'getDbWithAddressResolvedGetAccount resolved address for ens name: ',
                ensName,
                address,
            );
            if (!address) {
                console.info('no address found for ens name: ', ensName);
                return null;
            }
            return getAccount(address);
        };
    };

    const hasAccountForEnsName = (
        web3Provider: ethers.providers.JsonRpcProvider,
        hasAccount: (ensName: string) => Promise<boolean>,
    ) => {
        return async (ensName: string) => {
            const address = await web3Provider.resolveName(ensName);
            console.debug(
                'getDbWithAddressResolvedHasAccount resolved address for ens name: ',
                ensName,
                address,
            );
            if (!address) {
                console.info('no address found for ens name: ', ensName);
                return false;
            }
            return hasAccount(address);
        };
    };

    return {
        ...db,
        getAccount: getAccountForEnsName(web3Provider, db.getAccount),
        hasAccount: hasAccountForEnsName(web3Provider, db.hasAccount),
    };
};
//TODO remove
app.use(cors());
app.use(bodyParser.json());

(async () => {
    // load environment
    const deliveryServiceProperties = getDeliveryServiceProperties();
    const web3Provider = await getCachedWebProvider(process.env);
    const luksoProvider = await getLuksoProvider(process.env);

    const db = getDbWithAddressResolvedGetAccount(
        await getDatabase(),
        web3Provider,
    );
    const keys = readKeysFromEnv(process.env);
    const serverSecret = getServerSecret(process.env);

    // set the push notification configuration
    const pushNotificationConfig =
        deliveryServiceProperties.notificationChannel.filter(
            (data) => data.type === NotificationChannelType.PUSH,
        );

    if (pushNotificationConfig.length) {
        webpush.setVapidDetails(
            `mailto:${pushNotificationConfig[0].config.vapidEmailId}`,
            pushNotificationConfig[0].config.publicVapidKey,
            pushNotificationConfig[0].config.privateVapidKey,
        );
    }

    const io = new Server(server, {
        cors: {
            origin: '*',
            methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
            preflightContinue: false,
            optionsSuccessStatus: 204,
        },
    });

    const webSocketManager = new WebSocketManager(
        io,
        web3Provider,
        db,
        serverSecret,
    );

    app.use(logRequest);

    app.get('/hello', (req, res) => {
        return res.status(200).send('Hello DM3');
    });

    app.use('/metrics', Metrics(db, deliveryServiceProperties));
    app.use('/auth', Authenticate(db, serverSecret, web3Provider));
    app.use('/profile', Profile(db, web3Provider, luksoProvider, serverSecret));
    app.use('/delivery', Delivery(web3Provider, db, serverSecret));
    app.use(
        '/notifications',
        Notifications(
            deliveryServiceProperties,
            db,
            web3Provider,
            serverSecret,
        ),
    );
    app.use(logError);
    app.use(errorHandler);
    io.use(socketAuth(db, web3Provider, serverSecret));
    io.on(
        'connection',
        onConnection(
            io,
            web3Provider,
            db,
            keys,
            serverSecret,
            webSocketManager,
        ),
    );
    startCleanUpPendingMessagesJob(db, deliveryServiceProperties.messageTTL);
    app.use(
        '/rpc',
        RpcProxy(
            new Axios({ url: process.env.RPC }),
            deliveryServiceProperties,
            io,
            web3Provider,
            db,
            keys,
            webSocketManager,
        ),
    );
})();

const port = process.env.PORT || '8080';

server.listen(port, () => {
    logInfo({
        text: '[Server] listening',
        port,
        dir: __dirname,
    });
});
