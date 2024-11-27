import { computed, ref, markRaw, type Ref } from 'vue';
import { Dm3, Dm3Sdk, type Dm3SdkConfig } from '@dm3-org/dm3-js-sdk';
import {ethers} from 'ethers';
import type { Conversation } from '@dm3-org/dm3-lib-storage';
import { transformToMessages, transformToRooms } from '@/chatUtils';
import { computedAsync } from '@vueuse/core';

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
    loggedInAccount: Ref<string | null>;
    fetchMessages: (room, options) => Promise<void>;
    getConversations: () => any[]; // TODO: fix types
    messages: Ref; // TODO: fix types
    init: () => Promise<void>;
    startTestConversation: () => Promise<void>;
    isReady: Ref<boolean>;
    conversationsPreview: Ref<any[]>;
    selectedConversation: Ref<Conversation | null>;
    sendMessage: (message: any) => Promise<void>;
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
    const roomsLoaded = ref(false);
    const messagesLoaded = ref(false);
    const dm3Instance = ref<Dm3 | null>(null);
    const isReady = ref(false);
    const selectedConversation = ref<Conversation | null>(null);
    const loggedInAccount = ref<string | null>(null);

    const init = async () => {
        const dm3 = await sdk.universalProfileLoginWithCache(requestProvider);
        dm3Instance.value = markRaw(dm3);
        isReady.value = true;
        loggedInAccount.value = 'TODO';
    };

    const conversationsPreview = computed(() => {
        return dm3Instance.value?.conversations.list || [];
    });

    const rooms = computedAsync(async () => {
        roomsLoaded.value = false;
        await Promise.all(conversationsPreview.value.map((conv) => {
            return conv.messages.init();
        }));
        roomsLoaded.value = true;
        
        return transformToRooms(conversationsPreview.value);
    });

    const messages = ref<any[]>([]);

    const startTestConversation = async () => {
        if (!dm3Instance) {
            console.error('dm3Instance is not initialized');
            return;
        }

        const conv = await dm3Instance.value?.conversations?.addConversation('alice.eth');
        await conv?.messages.sendMessage('Hello, world!');
    }

    const fetchMessages = async ({ room, options = {} }) => {
        messagesLoaded.value = false;
       
        console.log('fetchMessages', room, options);

        messages.value = transformToMessages(conversationsPreview.value
            .find((c) => c.contact.account.ensName === room.roomId)
            ?.messages.list || []);

        messagesLoaded.value = true;
    }

    const sendMessage = async ({content, roomId, replyMessage, files, usersTag}) => {
        if (!dm3Instance) {
            console.error('dm3Instance is not initialized');
            return;
        }

        console.log('sendMessage', {content, roomId, replyMessage, files, usersTag});

        const conv = await dm3Instance.value?.conversations?.addConversation(roomId);
        await conv?.messages.sendMessage(content);
    }

    return {
        loggedInAccount,
        fetchMessages,
        sendMessage,
        messages,
        rooms,
        roomsLoaded,
        messagesLoaded,
        isReady, 
        init, 
        startTestConversation, 
        conversationsPreview, 
        selectedConversation 
    };
}
