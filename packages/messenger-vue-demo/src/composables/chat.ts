import { computed, ref } from 'vue';
// import { sha256, stringify } from '@dm3-org/dm3-lib-shared';
import { Dm3Sdk, type Dm3SdkConfig } from '@dm3-org/dm3-js-sdk';
import { JsonRpcProvider } from '@ethersproject/providers';
// import type { Dm3 } from '@dm3-org/dm3-js-sdk/lib/esm/Dm3';
// import { DM3 } from '@dm3-org/dm3-messenger-widget';

/*
REACT_APP_ADDR_ENS_SUBDOMAIN=.testing-addr.dm3.eth
REACT_APP_BACKEND=https://testing.dm3.network/api
REACT_APP_DEFAULT_DELIVERY_SERVICE=testing-ds.dm3.eth
REACT_APP_DEFAULT_SERVICE=https://testing.dm3.network/api
REACT_APP_MAINNET_PROVIDER_RPC=https://eth-sepolia.g.alchemy.com/v2/DBATzBzSluCdFAA6Zi7YMWHpDGm1soJI
REACT_APP_PROFILE_BASE_URL=https://testing.dm3.network/api
REACT_APP_RESOLVER_BACKEND=https://testing.dm3.network/resolver-handler
REACT_APP_USER_ENS_SUBDOMAIN=.testing-user.dm3.eth
REACT_APP_PUBLIC_VAPID_KEY=
REACT_APP_WALLET_CONNECT_PROJECT_ID=27b3e102adae76b4d4902a035da435e7
REACT_APP_COMMIT_HASH=ce2c319
REACT_APP_BRANCH=1106-Refine-Delivery-Service-Auth-for-Alias-names
REACT_APP_BUILD_TIME=2024-07-29T15:11:32
REACT_APP_ENVIRONMENT_NAME=testing
REACT_APP_MAINNET_PROVIDER_RPC=https://eth-sepolia.g.alchemy.com/v2/DBATzBzSluCdFAA6Zi7YMWHpDGm1soJI
REACT_APP_CHAIN_ID=11155111
REACT_APP_NONCE=0xa1b38837dd52e70a250ac2bf3e19f1599833e9d30662bf69a1c12e5747ed9f65
RESOLVER_ADDRESS=0x88c8cc822095cde6f92c8d20311c8e7de6a98694
SIGNING_PUBLIC_KEY=ZUKR41erJMdNBnnQ6jNBgJDkSuMlqCKYppe0X7gZB1s=
SIGNING_PRIVATE_KEY=/KJ9kgiuP/saDnlbcehcsihVn4CtBNMXYbc91oru7NtlQpHjV6skx00GedDqM0GAkORK4yWoIpiml7RfuBkHWw==
SIGNER_PRIVATE_KEY=0xc13e4d81452e047728d8f878b9e4aebfcc3cc0675b18e8a64ce99ad5b1b67177
SPAM_PROTECTION=false
ENCRYPTION_PUBLIC_KEY=dF3KN0+T1GMO6jkgB1VDGHJHo5tm1WPMbitPpTu8jEM=
ENCRYPTION_PRIVATE_KEY=7YHqt52A/VREF9B9q6hkm1c/5aPKBYITw/S5H28l2yI=
RPC=https://eth-sepolia.g.alchemy.com/v2/DBATzBzSluCdFAA6Zi7YMWHpDGm1soJI
URL=testing.dm3.network
CERT_MAIL=malteish+certbot@dm3.org
DATABASE_URL=postgresql://prisma:prisma@dm3-storage:5432/dm3
RESOLVER_SUPPORTED_ADDR_ENS_SUBDOMAINS='["testing-addr.dm3.eth" ,"subtesting-addr.dm3.eth" ]'
RESOLVER_SUPPORTED_NAME_ENS_SUBDOMAINS='["testing-user.dm3.eth" ,"subtesting-name.dm3.eth" ]'
PERSISTENCE_DIRECTORY=/mnt/dm3_prod_volume
*/

const config: Dm3SdkConfig = {
    mainnetProvider: new JsonRpcProvider('https://eth-sepolia.g.alchemy.com/v2/DBATzBzSluCdFAA6Zi7YMWHpDGm1soJI'), // 'https://rpc.lukso.network'
    nonce: '0x0', // TODO why not hex?
    defaultDeliveryService: 'testing-ds.dm3.eth',
    addressEnsSubdomain: 'testing-addr.dm3.eth',
    userEnsSubdomain: 'testing-user.dm3.eth',
    resolverBackendUrl: 'https://testing.dm3.network/resolver-handler',
    backendUrl: 'https://testing.dm3.network/api',
    storageApi: {
        getConversations: () => Promise.resolve([]),
        getMessages: () => Promise.resolve([]),
        getHaltedMessages: () => Promise.resolve([]),
        clearHaltedMessages: () => Promise.resolve(),
        addMessageBatch: () => Promise.resolve(''),
        addConversation: () => Promise.resolve(),
        getNumberOfMessages: () => Promise.resolve(0),
        getNumberOfConverations: () => Promise.resolve(0),
        editMessageBatch: () => Promise.resolve(),
        addMessage: () => Promise.resolve(''),
        toggleHideConversation: () => Promise.resolve(),
    },
};

const sdk = new Dm3Sdk(config);

export function useDm3Chat() {
    const dm3Instance = ref<any | null>(null);
    const init = async () => {
        const dm3 = await sdk.universalProfileLogin();
        // const dm3 = {};
        dm3Instance.value = dm3;
    };
    // init();

    const rooms = computed(() => dm3Instance.value?.conversations?.conversations);
    const messages = ref(rooms.value?.at(0));
    return { rooms, messages, init };
}