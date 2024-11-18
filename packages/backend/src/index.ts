import {
    Authenticate,
    errorHandler,
    getCachedWebProvider,
    getServerSecret,
    logError,
    logRequest,
    getLuksoProvider,
} from '@dm3-org/dm3-lib-server-side';
import { logInfo } from '@dm3-org/dm3-lib-shared';
import bodyParser from 'body-parser';
import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import http from 'http';
import path from 'path';
import { getDatabase } from './persistence/getDatabase';
import Storage from './storage';
import Profile from './profile/profile';

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb' }));

const server = http.createServer(app);

//TODO remove
app.use(cors());
app.use(bodyParser.json());

(async () => {
    const db = await getDatabase();
    const web3Provider = await getCachedWebProvider(process.env);
    const luksoProvider = await getLuksoProvider(process.env);
    const serverSecret = getServerSecret(process.env);

    app.use(logRequest);

    app.get('/hello', (req, res) => {
        return res.status(200).send('Hello DM3');
    });
    app.use('/profile', Profile(db, web3Provider, luksoProvider, serverSecret));
    app.use('/storage', Storage(db, web3Provider, serverSecret));
    app.use('/auth', Authenticate(db, serverSecret, web3Provider));
    app.use(logError);
    app.use(errorHandler);
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
