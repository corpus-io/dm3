import { Lukso } from '@dm3-org/dm3-lib-smart-account';
import { ethers } from 'ethers';
import ERC725Abi from './ERC725Abi.json';
import { SmartAccountConnector } from './SmartAccountConnector';

declare global {
    interface Window {
        lukso?: any;
    }
}
export class LuksoConnector {
    //TODO move to class tailored to lukso
    public static async _instance(
        lukso: ethers.providers.ExternalProvider,
        nonce: string,
        defaultDeliveryService: string,
    ): Promise<SmartAccountConnector> {
        //The universal profile extension can be accessed via the window.lukso object
        // if (!window.lukso) {
        //     throw 'Universal Profile extension not found';
        // }
        const provider = new ethers.providers.Web3Provider(lukso);
        //Connect with the UP extension
        console.log('done0');
        await provider.send('eth_requestAccounts', []);
        console.log('done1');

        //The signer that will be used to sign transactions
        const upController = await provider.getSigner();
        console.log('done2');
        //When used with UP the signer.getAddress() will return the UP address. Even though the signer uses the controller address to sign transactions
        //TODO clearify with Lukso-Team if that is always the case
        const upAddress = upController._address;
        console.log(upController);
        console.log('done3 ', upAddress);

        //Instance of the UP contract
        const upContract = new ethers.Contract(
            upAddress,
            ERC725Abi,
            upController,
        );
        const keyStore = new Lukso.LuksoKeyStore(upContract);

        return new SmartAccountConnector(
            keyStore,
            upController,
            nonce,
            defaultDeliveryService,
        );
    }
}
