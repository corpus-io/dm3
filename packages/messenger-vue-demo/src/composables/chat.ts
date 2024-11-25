import { computed, ref, markRaw, type Ref } from 'vue';
// import { sha256, stringify } from '@dm3-org/dm3-lib-shared';
import { Dm3, Dm3Sdk, type Dm3SdkConfig } from '@dm3-org/dm3-js-sdk';
import { JsonRpcProvider } from '@ethersproject/providers';
import {ethers} from 'ethers';
// import type { Dm3 } from '@dm3-org/dm3-js-sdk/lib/esm/Dm3';
// import { DM3 } from '@dm3-org/dm3-messenger-widget';

const sepoliaProvider = new ethers.providers.JsonRpcProvider("https://eth-sepolia.g.alchemy.com/v2/cBTHRhVcZ3Vt4BOFpA_Hi5DcTB1KQQV1", {
    name: 'sepolia',
    chainId: 11155111,
    ensAddress: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
});

const configLukso: Dm3SdkConfig = {
    mainnetProvider: sepoliaProvider,
    nonce: '0xa1b38837dd52e70a250ac2bf3e19f1599833e9d30662bf69a1c12e5747ed9f65', // This will be the current timestamp
    defaultDeliveryService: "testing-ds.dm3.eth",
    addressEnsSubdomain: ".testing-addr.dm3.eth",
    userEnsSubdomain: ".testing-user.dm3.eth",
    resolverBackendUrl: "https://testing.dm3.network/resolver-handler",
    backendUrl: "https://testing.dm3.network/api",
    // storageApi: {
    //     getConversations: () => Promise.resolve([]),
    //     getMessages: () => Promise.resolve([]),
    //     getHaltedMessages: () => Promise.resolve([]),
    //     clearHaltedMessages: () => Promise.resolve(),
    //     addMessageBatch: () => Promise.resolve(''),
    //     addConversation: () => Promise.resolve(),
    //     getNumberOfMessages: () => Promise.resolve(0),
    //     getNumberOfConverations: () => Promise.resolve(0),
    //     editMessageBatch: () => Promise.resolve(),
    //     addMessage: () => Promise.resolve(''),
    //     toggleHideConversation: () => Promise.resolve(),
    // },
};

const sdk = new Dm3Sdk(configLukso);

// https://docs.lukso.tech/install-up-browser-extension/

type UseDm3ChatReturnType = {
    rooms: Ref; // TODO: fix types
    messages: Ref; // TODO: fix types
    init: () => Promise<void>;
    startTestConversation: () => Promise<void>;
    isReady: Ref<boolean>;
};

export function useDm3Chat(): UseDm3ChatReturnType {
    const dm3Instance = ref<Dm3 | null>(null);
    const isReady = ref(false);
    const init = async () => {
        console.log('dm3Instance', dm3Instance.value);
        
        // Listen for provider announcements
        window.addEventListener("eip6963:announceProvider", async (event) => {
            const dm3 = await sdk.universalProfileLogin((event as any).detail.provider);
            // mark as raw to avoid reactivity issues with vue
            // see: https://github.com/vuejs/core/issues/3024
            dm3Instance.value = markRaw(dm3);
            console.log('dm3Instance', dm3Instance.value);
            isReady.value = true;
        });
        
        // Request installed providers
        window.dispatchEvent(new Event("eip6963:requestProvider"));
    };
    // init();

    const rooms = computed(() => {
        console.log('dm3Instance.value?.conversations list', dm3Instance.value?.conversations.list);
        return dm3Instance.value?.conversations?.list;
    });
    const messages = computed(() => rooms.value?.at(0));

    const startTestConversation = async () => {
        console.log('dm3Instance', dm3Instance.value);
        console.log('dm3Instance.value?.conversations', dm3Instance.value?.conversations);
        const conv = await dm3Instance.value?.conversations?.addConversation('alice.eth');
        console.log('conv', conv);
        console.log('conv?.messages', conv?.messages.meta);
        console.log('conv?.contact', conv?.contact);
        await conv?.messages.sendMessage('Hello, world!');
        console.log('messages', messages.value);
    }

    return { rooms, messages, isReady, init, startTestConversation };
}