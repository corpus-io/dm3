import { StorageLocation } from 'dm3-lib-storage';
import {
    AccountInfo,
    ConnectionState,
    GlobalState,
    LeftViewSelected,
    MessageActionType,
    RightViewSelected,
    SelectedRightView,
} from '../utils/enum-type-utils';

export const initialState: GlobalState = {
    connection: {
        connectionState: ConnectionState.CollectingSignInData,
        storageLocation: StorageLocation.dm3Storage,
        defaultServiceUrl: process.env.REACT_APP_BACKEND as string,
    },
    accounts: {
        contacts: undefined,
        selectedContact: undefined,
    },
    cache: {
        abis: new Map<string, string>(),
        contacts: null,
        lastConversation: {
            account: null,
            message: null,
        },
    },
    userDb: undefined,
    uiState: {
        lastMessagePull: 0,
        proflieExists: false,
        browserStorageBackup: false,
    },
    auth: {
        currentSession: undefined,
        recentlyUsedSession: undefined,
        allSessions: {},
    },
    uiView: {
        selectedLeftView: LeftViewSelected.Contacts,
        selectedRightView: RightViewSelected.Default,
        selectedMessageView: {
            messageData: undefined,
            actionType: MessageActionType.NONE,
        },
    },
    modal: {
        loaderContent: '',
        contactToHide: undefined,
        addConversation: {
            active: false,
            ensName: undefined,
            processed: false,
        },
        openEmojiPopup: { action: false, data: undefined },
        lastMessageAction: MessageActionType.NONE,
    },
};
