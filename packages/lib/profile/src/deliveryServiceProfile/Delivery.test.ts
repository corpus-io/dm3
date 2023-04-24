import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { ethers } from 'ethers';

import {
    getDeliveryServiceClient,
    getDeliveryServiceProfile,
} from './Delivery';
import { DeliveryServiceProfile, UserProfile } from '../types';

describe('Delivery', () => {
    let axiosMock: MockAdapter;

    beforeAll(() => {
        axiosMock = new MockAdapter(axios);
    });

    afterEach(() => {
        axiosMock.reset();
    });
    describe('getDeliveryServiceProfile', () => {
        it('throws Exception if ENS name is invalid', async () => {
            const deliveryServices = ['blabla'];

            const mockGetEnsResolver = (_: string) => Promise.resolve(null);

            const provider = {
                getResolver: mockGetEnsResolver,
            } as ethers.providers.StaticJsonRpcProvider;

            try {
                await getDeliveryServiceProfile(
                    deliveryServices[0],
                    provider,
                    (_: string) => Promise.resolve(undefined),
                );
                fail();
            } catch (e) {
                expect(e).toBe('Unknown ENS name');
            }
        });

        it('returns undefined TextRecord is not a valid dm3Profile', async () => {
            const deliveryServices = ['blabla'];

            const mockGetEnsResolver = (_: string) =>
                Promise.resolve({
                    getText: (_: string) =>
                        Promise.resolve(JSON.stringify({ foo: 'bar' })),
                } as unknown);

            const provider = {
                getResolver: mockGetEnsResolver,
            } as ethers.providers.StaticJsonRpcProvider;

            const profile = await getDeliveryServiceProfile(
                deliveryServices[0],
                provider,
                (_: string) => Promise.resolve(undefined),
            );
            expect(profile).toBeUndefined();
        });
        it('Resolves Json Profile', async () => {
            const expectedProfile = {
                publicSigningKey: '1',
                publicEncryptionKey: '2',
                url: 'http://localhost',
            } as DeliveryServiceProfile;
            const deliveryServices = ['dm3.eth'];

            const mockGetEnsResolver = (_: string) =>
                Promise.resolve({
                    getText: (_: string) =>
                        Promise.resolve(JSON.stringify(expectedProfile)),
                } as unknown);

            const provider = {
                getResolver: mockGetEnsResolver,
            } as ethers.providers.StaticJsonRpcProvider;
            const receivedProfile = await getDeliveryServiceProfile(
                deliveryServices[0],
                provider,
                (_: string) => Promise.resolve(undefined),
            );

            expect(receivedProfile).toStrictEqual(receivedProfile);
        });
    });

    describe('getDeliveryServiceClient', () => {
        it('throws exception if no provider was specifed ', async () => {
            const profile = { deliveryServices: [] as string[] } as UserProfile;
            const mockGetEnsResolver = (_: string) => Promise.resolve(null);

            try {
                await getDeliveryServiceClient(
                    profile,
                    undefined as unknown as ethers.providers.StaticJsonRpcProvider,
                    (_: string) => Promise.resolve(undefined),
                ).get('/foo');
            } catch (e) {
                expect(e).toBe('Provider is undefined');
            }
        });
        it('throws exception if no deliveryServiceName was specifed ', async () => {
            const profile = { deliveryServices: [] as string[] } as UserProfile;
            const mockGetEnsResolver = (_: string) => Promise.resolve(null);

            const provider = {
                getResolver: mockGetEnsResolver,
            } as ethers.providers.StaticJsonRpcProvider;

            try {
                await getDeliveryServiceClient(profile, provider, (_: string) =>
                    Promise.resolve(undefined),
                ).get('/foo');
            } catch (e) {
                expect(e).toBe('Unknown ENS name');
            }
        });

        // eslint-disable-next-line max-len
        test('getDeliveryServiceClient -- return axios error if one deliveryService fails and no other is left ', async () => {
            const userProfile = {
                deliveryServices: ['blabla.ens'] as string[],
            } as UserProfile;

            const deliveryServiceProfile = {
                publicSigningKey: '1',
                publicEncryptionKey: '2',
                url: 'http://blabla.io',
            } as DeliveryServiceProfile;

            const mockGetEnsResolver = (_: string) =>
                Promise.resolve({
                    getText: (_: string) =>
                        Promise.resolve(JSON.stringify(deliveryServiceProfile)),
                } as unknown);

            const provider = {
                getResolver: mockGetEnsResolver,
            } as ethers.providers.StaticJsonRpcProvider;

            axiosMock.onGet('http://blabla.io/foo').reply(400);

            const res: any = await getDeliveryServiceClient(
                userProfile,
                provider,
                (_: string) => Promise.resolve(undefined),
            ).get('http://blabla.io/foo');

            expect(res.response.status).toBe(400);
        });
        // eslint-disable-next-line max-len
        test('getDeliveryServiceClient -- returns response if default deliveryService is working as intended ', async () => {
            const userProfile = {
                deliveryServices: ['blabla.ens'] as string[],
            } as UserProfile;

            const deliveryServiceProfile = {
                publicSigningKey: '1',
                publicEncryptionKey: '2',
                url: 'http://blabla.io',
            } as DeliveryServiceProfile;

            const mockGetEnsResolver = (_: string) =>
                Promise.resolve({
                    getText: (_: string) =>
                        Promise.resolve(
                            'data:application/json,' +
                                JSON.stringify(deliveryServiceProfile),
                        ),
                } as unknown);

            const provider = {
                getResolver: mockGetEnsResolver,
            } as ethers.providers.StaticJsonRpcProvider;

            axiosMock.onGet('http://blabla.io/foo').reply(200);

            const res = await getDeliveryServiceClient(
                userProfile,
                provider,
                (_: string) => Promise.resolve(undefined),
            ).get('/foo');

            expect(res.status).toBe(200);
        });

        // eslint-disable-next-line max-len
        test('getDeliveryServiceClient -- returns response if fallback deliveryService is working as intended ', async () => {
            const userProfile = {
                deliveryServices: ['blabla.ens', 'fallback.ens'],
            } as UserProfile;

            const deliveryServiceProfile = {
                publicSigningKey: '1',
                publicEncryptionKey: '2',
                url: 'http://blabla.io',
            } as DeliveryServiceProfile;

            const fallbackDeliveryServiceProfile1 = {
                publicSigningKey: '3',
                publicEncryptionKey: '4',
                url: 'http://fallback.io',
            } as DeliveryServiceProfile;

            const mockGetEnsResolver = (textRecord: string) =>
                Promise.resolve({
                    getText: (_: string) => {
                        if (textRecord === 'blabla.ens') {
                            return Promise.resolve(
                                'data:application/json,' +
                                    JSON.stringify(deliveryServiceProfile),
                            );
                        }
                        if (textRecord === 'fallback.ens') {
                            return Promise.resolve(
                                'data:application/json,' +
                                    JSON.stringify(
                                        fallbackDeliveryServiceProfile1,
                                    ),
                            );
                        }

                        return Promise.reject(textRecord);
                    },
                } as unknown);

            const provider = {
                getResolver: mockGetEnsResolver,
            } as ethers.providers.StaticJsonRpcProvider;

            axiosMock.onGet('http://blabla.io/foo').reply(400);
            axiosMock.onGet('http://fallback.io/foo').reply(200);

            const res = await getDeliveryServiceClient(
                userProfile,
                provider,
                (_: string) => Promise.resolve(undefined),
            ).get('/foo');

            expect(res.status).toBe(200);
            expect(res.config.baseURL).toBe('http://fallback.io');
        });
        test('getDeliveryServiceClient -- returns axios error if all delivery Services are failing ', async () => {
            const userProfile = {
                deliveryServices: ['blabla.ens', 'fallback.ens'],
            } as UserProfile;

            const deliveryServiceProfile = {
                publicSigningKey: '1',
                publicEncryptionKey: '2',
                url: 'http://blabla.io',
            } as DeliveryServiceProfile;

            const fallbackDeliveryServiceProfile1 = {
                publicSigningKey: '3',
                publicEncryptionKey: '4',
                url: 'http://fallback.io',
            } as DeliveryServiceProfile;

            const mockGetEnsResolver = (textRecord: string) =>
                Promise.resolve({
                    getText: (_: string) => {
                        if (textRecord === 'blabla.ens') {
                            return Promise.resolve(
                                'data:application/json,' +
                                    JSON.stringify(deliveryServiceProfile),
                            );
                        }
                        if (textRecord === 'fallback.ens') {
                            return Promise.resolve(
                                'data:application/json,' +
                                    JSON.stringify(
                                        fallbackDeliveryServiceProfile1,
                                    ),
                            );
                        }

                        return Promise.reject(textRecord);
                    },
                } as unknown);

            const provider = {
                getResolver: mockGetEnsResolver,
            } as ethers.providers.StaticJsonRpcProvider;

            axiosMock.onGet('http://blabla.io/foo').reply(400);
            axiosMock.onGet('http://fallback.io/foo').reply(400);

            const res: any = await getDeliveryServiceClient(
                userProfile,
                provider,
                (_: string) => Promise.resolve(undefined),
            ).get('/foo');

            expect(res.response.status).toBe(400);
        });
    });
});
