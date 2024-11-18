import { DEFAULT_NONCE } from '@dm3-org/dm3-lib-profile';
import { Constants, Lukso } from '@dm3-org/dm3-lib-smart-account';
import { mockUserProfile } from '@dm3-org/dm3-lib-test-helper';
import { ethers } from 'ethers';
import ERC725Abi from './ERC725Abi.json';
import {
    LoginStages,
    SmartAccountConnector,
    Success,
} from './SmartAccountConnector';

describe.skip('SmartAccountConnector', () => {
    describe('SignUp', () => {
        let universalProfile: ethers.Contract;
        let upController1: ethers.Signer;
        let upController2: ethers.Signer;
        let upController3: ethers.Signer;

        beforeEach(async () => {
            upController1 = ethers.Wallet.createRandom();
            upController2 = ethers.Wallet.createRandom();
            upController3 = ethers.Wallet.createRandom();

            const c = new ethers.Contract(
                ethers.Wallet.createRandom().address,
                ERC725Abi,
                upController1,
            );

            const mockKvStore = new Map<string, string>();

            universalProfile = {
                ...c,
                setDataBatch: (k: string[], v: string[]) => {
                    k.forEach((key, idx) => {
                        mockKvStore.set(key, v[idx]);
                    });
                },
                getData: (k: string) => {
                    return mockKvStore.get(k);
                },
            } as unknown as ethers.Contract;
        });

        describe('KeyStore', () => {
            it('should write initial profile to KV store', async () => {
                const luksoKeyStore = new Lukso.LuksoKeyStore(universalProfile);
                const connector = new SmartAccountConnector(
                    luksoKeyStore,
                    upController1,
                    DEFAULT_NONCE,
                    'ds.eth',
                );
                const loginResult = (await connector.login()) as Success;

                const profileKeys = loginResult.profileKeys;

                const data = JSON.parse(
                    ethers.utils.toUtf8String(
                        universalProfile.getData(Constants.DM3_KEYSTORE_KEY),
                    ),
                );

                const signerKeyStore = data[await upController1.getAddress()];
                expect(signerKeyStore).toBeDefined();

                expect(profileKeys!.encryptionKeyPair.publicKey).toBe(
                    signerKeyStore.signerPublicKey,
                );
            });
            it('device 1 can decrypt profile from previous signUp', async () => {
                const luksoKeyStore = new Lukso.LuksoKeyStore(universalProfile);
                const connector = new SmartAccountConnector(
                    luksoKeyStore,
                    upController1,
                    DEFAULT_NONCE,
                    'ds.eth',
                );
                //First call of login performs the signUp
                const loginResult1 = (await connector.login()) as Success;
                const initialProfileKeys = loginResult1.profileKeys;

                //Second call of login perfroms the signIn using the same keyStore
                const loginResult2 = (await connector.login()) as Success;
                const profileKeys = loginResult2.profileKeys;

                expect(initialProfileKeys).toStrictEqual(profileKeys);
            });
        });

        describe('New Device', () => {
            it('new device initialize key exchange by posting its publicKey', async () => {
                const luksoKeyStore = new Lukso.LuksoKeyStore(universalProfile);
                const connector1 = new SmartAccountConnector(
                    luksoKeyStore,
                    upController1,
                    DEFAULT_NONCE,
                    'ds.eth',
                );
                //Another device can signIn using the same keyStore
                const connector2 = new SmartAccountConnector(
                    luksoKeyStore,
                    upController2,
                    DEFAULT_NONCE,
                    'ds.eth',
                );

                //First call of login performs the signUp
                const loginResult1 = await connector1.login();

                //Second device has to post its public key to the UP. So device 1 can share the profile keys
                const loginResult2 = await connector2.login();

                expect(loginResult2.type).toBe('NEW_DEVICE');
                expect(
                    loginResult2.type === 'NEW_DEVICE' &&
                        loginResult2.controllers,
                ).toStrictEqual([await upController1.getAddress()]);

                const onChainKeyStore = JSON.parse(
                    ethers.utils.toUtf8String(
                        universalProfile.getData(Constants.DM3_KEYSTORE_KEY),
                    ),
                );

                console.log(onChainKeyStore);
                //the keyStore should contain the profile of device1 and the public key of device2

                expect(
                    onChainKeyStore[await upController1.getAddress()],
                ).toBeDefined();
                expect(
                    onChainKeyStore[await upController2.getAddress()]
                        .signerPublicKey,
                ).toBeDefined();
            });
            it('key exchange syncs profile keys to new devices', async () => {
                const luksoKeyStore = new Lukso.LuksoKeyStore(universalProfile);
                const connector1 = new SmartAccountConnector(
                    luksoKeyStore,
                    upController1,
                    DEFAULT_NONCE,
                    'ds.eth',
                );
                //Another device can signIn using the same keyStore
                const connector2 = new SmartAccountConnector(
                    luksoKeyStore,
                    upController2,
                    DEFAULT_NONCE,
                    'ds.eth',
                );
                //Thirs device to cover case of multiple devices
                const connector3 = new SmartAccountConnector(
                    luksoKeyStore,
                    upController3,
                    DEFAULT_NONCE,
                    'ds.eth',
                );

                //First call of login performs the signUp
                const loginResult1 = (await connector1.login()) as Success;

                //Second device has to post its public key to the UP. So device 1 can share the profile keys
                const loginResult2 = await connector2.login();
                //Thrid device has to post its public key to the UP. So device 1 can share the profile keys
                const loginResult3 = await connector3.login();
                console.log('check3');
                expect(loginResult1.type).toBe('SUCCESS');
                expect(loginResult2.type).toBe('NEW_DEVICE');
                expect(loginResult3.type).toBe('NEW_DEVICE');

                //Connector 1 is the only connector capable of sharing the profile keys

                //profileKeys from mockUserProfile are the same as the encryption keys of the connector
                await connector1.syncKeys();

                const data = JSON.parse(
                    ethers.utils.toUtf8String(
                        universalProfile.getData(Constants.DM3_KEYSTORE_KEY),
                    ),
                );

                //Now the decives can login again and should be able to decrypt the profile
                const loginResult21 = (await connector2.login()) as Success;

                const loginResult31 = (await connector3.login()) as Success;

                expect(loginResult21.type).toBe('SUCCESS');
                expect(loginResult31.type).toBe('SUCCESS');

                expect(loginResult21.profileKeys).toStrictEqual(
                    loginResult31.profileKeys,
                );

                expect(loginResult21.profileKeys).toStrictEqual(
                    loginResult1.profileKeys,
                );
            });
        });

        describe('getLoginStates', () => {
            it('returns new if a controller has never used dm3 before', async () => {
                const luksoKeyStore = new Lukso.LuksoKeyStore(universalProfile);
                const connector = new SmartAccountConnector(
                    luksoKeyStore,
                    upController1,
                    DEFAULT_NONCE,
                    'ds.eth',
                );
                const loginState = await connector.getLoginStages();

                expect(loginState).toEqual(LoginStages.NEW);
            });
            it('returns CONTROLLER_KNOWN if a controller already retrived the profile keys', async () => {
                const luksoKeyStore = new Lukso.LuksoKeyStore(universalProfile);
                const connector = new SmartAccountConnector(
                    luksoKeyStore,
                    upController1,
                    DEFAULT_NONCE,
                    'ds.eth',
                );
                await connector.login();
                const loginState = await connector.getLoginStages();

                expect(loginState).toEqual(LoginStages.CONTROLLER_KNOWN);
            });
            it('returns CONTROLLER_UNKNOWN if a a new controller is connected', async () => {
                const luksoKeyStore = new Lukso.LuksoKeyStore(universalProfile);
                const connector1 = new SmartAccountConnector(
                    luksoKeyStore,
                    upController1,
                    DEFAULT_NONCE,
                    'ds.eth',
                );

                const connector2 = new SmartAccountConnector(
                    luksoKeyStore,
                    upController2,
                    DEFAULT_NONCE,
                    'ds.eth',
                );
                await connector1.login();
                const loginState = await connector2.getLoginStages();

                expect(loginState).toEqual(LoginStages.CONTROLLER_UNKNOWN);
            });
            it('returns OPEN_KEY_EXCHANGE_REQUEST if a keyRequest is pending', async () => {
                const luksoKeyStore = new Lukso.LuksoKeyStore(universalProfile);
                const connector1 = new SmartAccountConnector(
                    luksoKeyStore,
                    upController1,
                    DEFAULT_NONCE,
                    'ds.eth',
                );

                const connector2 = new SmartAccountConnector(
                    luksoKeyStore,
                    upController2,
                    DEFAULT_NONCE,
                    'ds.eth',
                );
                await connector1.login();
                await connector2.login();

                //Controller 1 has to execute the keyExchangeRequest
                const loginState = await connector1.getLoginStages();

                expect(loginState).toEqual(
                    LoginStages.OPEN_KEY_EXCHANGE_REQUEST,
                );
            });
            it('returns KEY_EXCHANGE_PENDING if a keyRequest is pending', async () => {
                const luksoKeyStore = new Lukso.LuksoKeyStore(universalProfile);
                const connector1 = new SmartAccountConnector(
                    luksoKeyStore,
                    upController1,
                    DEFAULT_NONCE,
                    'ds.eth',
                );

                const connector2 = new SmartAccountConnector(
                    luksoKeyStore,
                    upController2,
                    DEFAULT_NONCE,
                    'ds.eth',
                );
                await connector1.login();
                await connector2.login();

                //Controller 1 has to execute the keyExchangeRequest
                const loginState = await connector2.getLoginStages();

                expect(loginState).toEqual(LoginStages.KEY_EXCHANGE_PENDING);
            });
        });
    });
});
