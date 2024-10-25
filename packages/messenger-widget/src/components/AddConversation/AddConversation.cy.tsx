import { Conversation } from '@dm3-org/dm3-lib-storage';
import { AuthContext, AuthContextType } from '../../context/AuthContext';
import { ConversationContext } from '../../context/ConversationContext';
import { ModalContext } from '../../context/ModalContext';
import {
    StorageContext,
    StorageContextType,
} from '../../context/StorageContext';
import { getMockedAuthContext } from '../../context/testHelper/getMockedAuthContext';
import { getMockedStorageContext } from '../../context/testHelper/getMockedStorageContext';
import { UiViewContext } from '../../context/UiViewContext';
import { DM3 } from '../../widget';
import AddConversation from './AddConversation';
import {
    DeliveryServiceContext,
    DeliveryServiceContextType,
} from '../../context/DeliveryServiceContext';
import { getMockedDeliveryServiceContext } from '../../context/testHelper/getMockedDeliveryServiceContext';
import { getMockedTldContext } from '../../context/testHelper/getMockedTldContext';
import { TLDContext } from '../../context/TLDContext';
import { getMockedConversationContext } from '../../context/testHelper/getMockedConversationContext';
import { getEmptyContact } from '../../interfaces/utils';
import { getMockedDm3Configuration } from '../../context/testHelper/getMockedDm3Configuration';
import { DM3ConfigurationContext } from '../../context/DM3ConfigurationContext';
import { getMockedUiViewContext } from '../../context/testHelper/getMockedUiViewContext';
import { getMockedModalContext } from '../../context/testHelper/getMockedModalContext';
import { getMockedMainnetProviderContext } from '../../context/testHelper/getMockedMainnetProviderContext';
import { MainnetProviderContext } from '../../context/ProviderContext';
import {
    MessageContext,
    MessageContextType,
} from '../../context/MessageContext';
import { getMockedMessageContext } from '../../context/testHelper/getMockedMessageContext';

// AddConversation component tests
describe('<AddConversation />', () => {
    const dm3Config = {
        userEnsSubdomain: process.env.REACT_APP_USER_ENS_SUBDOMAIN as string,
        addressEnsSubdomain: process.env.REACT_APP_ADDR_ENS_SUBDOMAIN as string,
        resolverBackendUrl: process.env.REACT_APP_RESOLVER_BACKEND as string,
        profileBaseUrl: process.env.REACT_APP_PROFILE_BASE_URL as string,
        defaultDeliveryService: process.env
            .REACT_APP_DEFAULT_DELIVERY_SERVICE as string,
        backendUrl: process.env.REACT_APP_BACKEND as string,
        chainId: process.env.REACT_APP_CHAIN_ID as string,
        defaultServiceUrl: process.env.REACT_APP_DEFAULT_SERVICE as string,
        ethereumProvider: process.env.REACT_APP_MAINNET_PROVIDER_RPC as string,
        walletConnectProjectId: process.env
            .REACT_APP_WALLET_CONNECT_PROJECT_ID as string,
        publicVapidKey: process.env.REACT_APP_PUBLIC_VAPID_KEY as string,
        defaultContact: 'defaultcontact.eth',
        nonce: process.env.REACT_APP_NONCE as string,
        showAlways: true,
        showContacts: true,
    };

    // Mount the Widget component before every test
    beforeEach(() => {
        // should mount DM3 component and render it
        cy.mount(<DM3 {...dm3Config} />);
    });

    // test for render AddConversation component
    it('Renders <AddConversation> component', () => {
        // should mount AddConversation component and render it
        cy.mount(<AddConversation />);
    });

    // test for change in conversation name
    it('Should change conversation name', () => {
        // should mount AddConversation component and render it
        cy.mount(<AddConversation />);
        // should change conversation name input field
        cy.get('.conversation-name')
            .clear()
            .type('bob.eth')
            .should('have.value', 'bob.eth');
    });

    // test for invalid conversation name
    it('Should display error for invalid conversation name', () => {
        // should mount AddConversation component and render it
        cy.mount(<AddConversation />);
        // should change conversation name input field
        cy.get('.conversation-name').clear().type('abc-xyz#.eth');
        // should show error for invalid conversation name
        cy.get('.conversation-error').should(
            'have.text',
            'Invalid address or ENS name',
        );
    });

    // test to add conversation name successfully
    it('Should change conversation name', () => {
        const CONTACT_NAME = 'user.dm3.eth';

        const authContext: AuthContextType = getMockedAuthContext({
            account: {
                ensName: 'alice.eth',
                profile: {
                    deliveryServices: ['ds.eth'],
                    publicEncryptionKey: '',
                    publicSigningKey: '',
                },
            },
        });

        const storageContext: StorageContextType = getMockedStorageContext({
            getConversations: function (page: number): Promise<Conversation[]> {
                return Promise.resolve([]);
            },
            initialized: true,
        });

        const deliveryServiceContext: DeliveryServiceContextType =
            getMockedDeliveryServiceContext({
                fetchIncomingMessages: function (ensName: string) {
                    return Promise.resolve([]);
                },
                getDeliveryServiceProperties: function (): Promise<any[]> {
                    return Promise.resolve([{ sizeLimit: 0 }]);
                },
                isInitialized: true,
            });

        const tldContext = getMockedTldContext({
            resolveTLDtoAlias: async (alias: string) => {
                return CONTACT_NAME;
            },
        });

        const conversationContext = getMockedConversationContext({
            selectedContact: getEmptyContact(
                'max.eth',
                undefined,
                false,
                0,
                [],
            ),
        });

        const uiViewContext = getMockedUiViewContext();

        const dm3ConfigurationContext = getMockedDm3Configuration();

        const modalContext = getMockedModalContext({
            showAddConversationModal: true,
            setLoaderContent: (loader: string) => {
                console.log('loader active...');
            },
        });

        const mainnetContext = getMockedMainnetProviderContext();

        const messageContext = getMockedMessageContext() as MessageContextType;

        // should mount AddConversation component and render it
        cy.mount(
            <>
                <DM3ConfigurationContext.Provider
                    value={dm3ConfigurationContext}
                >
                    <UiViewContext.Provider value={uiViewContext}>
                        <ModalContext.Provider value={modalContext}>
                            <MainnetProviderContext.Provider
                                value={mainnetContext}
                            >
                                <TLDContext.Provider value={tldContext}>
                                    <AuthContext.Provider value={authContext}>
                                        <DeliveryServiceContext.Provider
                                            value={deliveryServiceContext}
                                        >
                                            <StorageContext.Provider
                                                value={storageContext}
                                            >
                                                <ConversationContext.Provider
                                                    value={conversationContext}
                                                >
                                                    <MessageContext.Provider
                                                        value={messageContext}
                                                    >
                                                        <AddConversation />
                                                    </MessageContext.Provider>
                                                </ConversationContext.Provider>
                                            </StorageContext.Provider>
                                        </DeliveryServiceContext.Provider>
                                    </AuthContext.Provider>
                                </TLDContext.Provider>
                            </MainnetProviderContext.Provider>
                        </ModalContext.Provider>
                    </UiViewContext.Provider>
                </DM3ConfigurationContext.Provider>
            </>,
        );

        // should change conversation name input field
        cy.get('.conversation-name').clear().type('bob.eth');
    });
});
