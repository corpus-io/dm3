import { Lukso } from '@dm3-org/dm3-lib-smart-account';
import { ethers } from 'ethers';
import ERC725Abi from './ERC725Abi.json';
import { SmartAccountConnector } from './SmartAccountConnector';

export class LuksoConnector {
    //TODO move to class tailored to lukso
    public static async _instance(
        lukso: ethers.providers.ExternalProvider,
        nonce: string,
        defaultDeliveryService: string,
    ): Promise<SmartAccountConnector> {
        const provider = new ethers.providers.Web3Provider(lukso);
        //Connect with the UP extension
        console.log('done0');
        await provider.send('eth_requestAccounts', []);
        console.log('done1');

        //The signer that will be used to sign transactions
        const upController = provider.getSigner();
        console.log('done2');
        //When used with UP the signer.getAddress() will return the UP address. Even though the signer uses the controller address to sign transactions
        //TODO clearify with Lukso-Team if that is always the case
        const upAddress = await upController.getAddress();
        console.log(upController);
        console.log('done3 .', upAddress);

        
        //Instance of the UP contract 
        const upContract = new ethers.Contract(
            upAddress,
            ERC725Abi,
            upController,
        );
        console.log('done4', upContract);
        const keyStore = new Lukso.LuksoKeyStore(upContract);
        console.log('done5', keyStore);


        const sc = new SmartAccountConnector(
            keyStore,
            upController,
            nonce,
            defaultDeliveryService,
        );

        console.log('done6', sc);

        return sc;
    }
}
