import { computed, ref, markRaw, type Ref } from 'vue';
import { Dm3, Dm3Sdk, type Dm3SdkConfig } from '@dm3-org/dm3-js-sdk';
import {ethers} from 'ethers';

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
};

const sdk = new Dm3Sdk(configLukso);

// TODO: check for installed extension
// https://docs.lukso.tech/install-up-browser-extension/

type UseDm3ChatReturnType = {
    rooms: Ref; // TODO: fix types
    messages: Ref; // TODO: fix types
    init: () => Promise<void>;
    startTestConversation: () => Promise<void>;
    isReady: Ref<boolean>;
};

const requestProvider = (): Promise<ethers.providers.ExternalProvider> => {
    return new Promise((resolve) => {
        window.addEventListener("eip6963:announceProvider", (event) => {
            const provider = (event as any).detail.provider;
            console.log('Provider:', provider);
            resolve(provider);
        });

        // Request installed providers
        window.dispatchEvent(new Event("eip6963:requestProvider"));
    });
};

export function useDm3Chat(): UseDm3ChatReturnType {
    const dm3Instance = ref<Dm3 | null>(null);
    const isReady = ref(false);
    const init = async () => {
        const dm3 = await sdk.universalProfileLoginWithCache(requestProvider);
        dm3Instance.value = markRaw(dm3);
        isReady.value = true;
    };

    const rooms = computed(() => {
        console.log('dm3Instance.value?.conversations list', dm3Instance.value?.conversations.list);
        return dm3Instance.value?.conversations?.list
    });
    const messages = computed(() => rooms.value?.at(0));

    const startTestConversation = async () => {
        if (!dm3Instance) {
            console.error('dm3Instance is not initialized');
            return;
        }

        const conv = await dm3Instance.value?.conversations?.addConversation('alice.eth');
        await conv?.messages.sendMessage('Hello, world!');
    }

    return { rooms, messages, isReady, init, startTestConversation };
}