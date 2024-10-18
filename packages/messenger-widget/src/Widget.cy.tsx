import { DM3 } from './widget';

// DM3 component tests
describe('<DM3 />', () => {
    // test for render DM3 component
    it('Renders <DM3> component', () => {
        const dm3Config = {
            userEnsSubdomain: process.env
                .REACT_APP_USER_ENS_SUBDOMAIN as string,
            addressEnsSubdomain: process.env
                .REACT_APP_ADDR_ENS_SUBDOMAIN as string,
            resolverBackendUrl: process.env
                .REACT_APP_RESOLVER_BACKEND as string,
            profileBaseUrl: process.env.REACT_APP_PROFILE_BASE_URL as string,
            defaultDeliveryService: process.env
                .REACT_APP_DEFAULT_DELIVERY_SERVICE as string,
            backendUrl: process.env.REACT_APP_BACKEND as string,
            chainId: process.env.REACT_APP_CHAIN_ID as string,
            defaultServiceUrl: process.env.REACT_APP_DEFAULT_SERVICE as string,
            ethereumProvider: process.env
                .REACT_APP_MAINNET_PROVIDER_RPC as string,
            walletConnectProjectId: process.env
                .REACT_APP_WALLET_CONNECT_PROJECT_ID as string,
            publicVapidKey: process.env.REACT_APP_PUBLIC_VAPID_KEY as string,
            defaultContact: 'defaultcontact.eth',
            nonce: process.env.REACT_APP_NONCE as string,
            showAlways: true,
            showContacts: true,
        };

        // should mount DM3 component and render it
        cy.mount(<DM3 {...dm3Config} />);

        // on render, it should contain button with text : Connect with Wallet
        cy.get('button').should('contains.text', 'Connect with Wallet');
    });
});
