import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import chai from 'chai';
import chaiHttp from 'chai-http';
import { ethers } from 'ethers';
import { Server as HttpServerType } from 'http';
import { io as Client } from 'socket.io-client';
import _winston from 'winston';
import { getBillboardClientApp } from '../../src/getBillboardClientApp';
import { getDatabase, getRedisClient } from '../../src/persitance/getDatabase';
import { mockDeliveryServiceProfile } from '../helper/mockDeliveryServiceProfile';
import { mockHttpServer } from '../helper/mockHttpServer';
import { mockUserProfile } from '../helper/mockUserProfile';
import { mockWsServer } from '../helper/mockWsServer';

chai.use(chaiHttp);

chai.should();
describe('RpcApi', () => {
    let winston;
    let redis;
    let provider;

    afterEach(async () => {
        ds1httpServer.close();
        ds2httpServer.close();
        ds3httpServer.close();
        redis.quit();
    });
    //HttpServers of the delivery services
    let ds1httpServer: HttpServerType;
    let ds2httpServer: HttpServerType;
    let ds3httpServer: HttpServerType;
    //Billboard 1 profile
    let billboard1profile;
    //Billboard 2 profile
    let billboard2profile;

    //DeliveryService 1 profile
    let ds1Profile;
    //DeliveryService 2 profile
    let ds2Profile;
    //DeliveryService 3 profile
    let ds3Profile;

    //DeliveryService 1 wsSocket client
    let ds1WsServer;
    //DeliveryService 2 wsSocket client
    let ds2WsServer;
    //DeliveryService 3 wsSocket client
    let ds3WsServer;

    //Axios mock to mock the http requests
    let axiosMock;
    beforeEach(async () => {
        winston = _winston.createLogger();
        redis = await getRedisClient(winston);
        billboard1profile = await mockUserProfile(
            ethers.Wallet.createRandom(),
            'billboard1.eth',
            ['ds1.eth', 'ds2.eth', 'ds3.eth'],
        );
        billboard2profile = await mockUserProfile(
            ethers.Wallet.createRandom(),
            'billboard2.eth',
            ['ds1.eth', 'ds2.eth', 'ds3.eth'],
        );

        //DS 1
        ds1Profile = await mockDeliveryServiceProfile(
            ethers.Wallet.createRandom(),
            'http://localhost:4060',
        );
        ds1httpServer = await mockHttpServer(4060);
        ds1WsServer = await mockWsServer(ds1httpServer);
        axiosMock = new MockAdapter(axios);

        axiosMock
            .onGet('http://localhost:4060/auth/billboard1.eth')
            .reply(200, {
                challenge: 'mock-challenge',
            });
        axiosMock
            .onPost('http://localhost:4060/auth/billboard1.eth')
            .reply(200, {
                token: 'mock-token',
            });

        axiosMock
            .onGet('http://localhost:4060/auth/billboard2.eth')
            .reply(200, {
                challenge: 'mock-challenge',
            });
        axiosMock
            .onPost('http://localhost:4060/auth/billboard2.eth')
            .reply(200, {
                token: 'mock-token',
            });

        //DS 2
        ds2Profile = await mockDeliveryServiceProfile(
            ethers.Wallet.createRandom(),
            'http://localhost:4061',
        );
        ds2httpServer = await mockHttpServer(4061);
        ds2WsServer = await mockWsServer(ds2httpServer);

        axiosMock
            .onGet('http://localhost:4061/auth/billboard1.eth')
            .reply(200, {
                challenge: 'mock-challenge',
            });
        axiosMock
            .onPost('http://localhost:4061/auth/billboard1.eth')
            .reply(200, {
                token: 'mock-token',
            });
        axiosMock
            .onGet('http://localhost:4061/auth/billboard2.eth')
            .reply(200, {
                challenge: 'mock-challenge',
            });
        axiosMock
            .onPost('http://localhost:4061/auth/billboard2.eth')
            .reply(200, {
                token: 'mock-token',
            });
        //DS 3
        ds3Profile = await mockDeliveryServiceProfile(
            ethers.Wallet.createRandom(),
            'http://localhost:4062',
        );
        ds3httpServer = await mockHttpServer(4062);
        ds3WsServer = await mockWsServer(ds3httpServer);

        axiosMock
            .onGet('http://localhost:4062/auth/billboard1.eth')
            .reply(200, {
                challenge: 'mock-challenge',
            });
        axiosMock
            .onPost('http://localhost:4062/auth/billboard1.eth')
            .reply(200, {
                token: 'mock-token',
            });
        axiosMock
            .onGet('http://localhost:4062/auth/billboard2.eth')
            .reply(200, {
                challenge: 'mock-challenge',
            });
        axiosMock
            .onPost('http://localhost:4062/auth/billboard2.eth')
            .reply(200, {
                token: 'mock-token',
            });

        provider = {
            resolveName: () => billboard1profile.address,
            getResolver: (ensName: string) => {
                if (ensName === 'billboard1.eth') {
                    return {
                        getText: () => billboard1profile.stringified,
                    } as unknown as ethers.providers.Resolver;
                }
                if (ensName === 'ds1.eth') {
                    return {
                        getText: () => ds1Profile.stringified,
                    } as unknown as ethers.providers.Resolver;
                }
                if (ensName === 'ds2.eth') {
                    return {
                        getText: () => ds2Profile.stringified,
                    } as unknown as ethers.providers.Resolver;
                }
                if (ensName === 'ds3.eth') {
                    return {
                        getText: () => ds3Profile.stringified,
                    } as unknown as ethers.providers.Resolver;
                }
                throw new Error('mock provider unknown ensName');
            },
        } as unknown as ethers.providers.JsonRpcProvider;
    });

    describe('viewerCount', () => {
        it('returns success with viewer count', async () => {
            const db = await getDatabase(winston, redis);

            const { app, httpServer } = await getBillboardClientApp(
                provider,
                db,
                4444,
            );
            const viewer1 = Client('http://localhost:4444');

            const viewer1IsConnected = await new Promise((res, rej) => {
                viewer1.on('connect', () => {
                    res(true);
                });
                viewer1.on('connect_error', (err: any) => {
                    rej(false);
                });
            });

            expect(viewer1IsConnected).toBe(true);

            const res = await chai.request(app).post('/rpc').send({
                jsonrpc: '2.0',
                method: 'dm3_billboard_countActiveViewers',
                params: [],
            });

            expect(res.body.result.viewers).toBe(1);
            await httpServer.close();
            await viewer1.close();
        });

        it("returns empty viewers list if there aren't any", async () => {
            const db = await getDatabase(winston, redis);

            const { app, httpServer } = await getBillboardClientApp(
                provider,
                db,
                4444,
            );

            const res = await chai.request(app).post('/rpc').send({
                jsonrpc: '2.0',
                method: 'dm3_billboard_countActiveViewers',
                params: [],
            });

            expect(res.body.result.viewers).toBe(0);
            httpServer.close();
        });
    });
});
