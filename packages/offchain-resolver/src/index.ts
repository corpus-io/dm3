import bodyParser from 'body-parser';
import cors from 'cors';
import * as dotenv from 'dotenv';
import express from 'express';
import http from 'http';
import { resolverEndpoint } from './http/resolverEndpoint';
import { getDatabase } from './persistence/getDatabase';
import { getWeb3Provider } from './utils/getWeb3Provider';
import { getLuksoProvider } from './utils/getLuksoProvider';

import { profile } from './http/profile';

dotenv.config();

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb' }));

const server = http.createServer(app);

app.use(cors());
app.use(bodyParser.json());

(async () => {
    console.log('offchainResolver handler env', process.env);

    app.locals.db = await getDatabase();
    app.locals.config = {
        spamProtection: process.env.SPAM_PROTECTION === 'true',
    };

    app.use('/', resolverEndpoint());
    app.use('/profile', profile(getWeb3Provider(), getLuksoProvider()));
})();
const port = process.env.PORT || '8081';
server.listen(port, () => {
    console.info(
        '[Server] listening at port ' + port + ' and dir ' + __dirname,
    );
});
