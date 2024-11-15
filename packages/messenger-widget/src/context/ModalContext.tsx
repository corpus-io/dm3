import React from 'react';
import { NewContact } from '../interfaces/utils';
import {
    MessageActionType,
    ProfileScreenType,
    ProfileType,
} from '../utils/enum-type-utils';
import {
    DisabledOptionsType,
    IConfigureProfileModal,
    IOpenEmojiPopup,
    PreferencesOptionType,
    useModal,
} from '../hooks/modals/useModal';
import { PREFERENCES_ITEMS } from '../components/Preferences/bl';

export type ModalContextType = {
    loaderContent: string;
    setLoaderContent: (content: string) => void;
    contactToHide: string | undefined;
    setContactToHide: (action: string | undefined) => void;
    addConversation: NewContact;
    setAddConversation: (contact: NewContact) => void;
    openEmojiPopup: IOpenEmojiPopup;
    setOpenEmojiPopup: (action: IOpenEmojiPopup) => void;
    lastMessageAction: MessageActionType;
    setLastMessageAction: (action: MessageActionType) => void;
    showProfileConfigurationModal: boolean;
    setShowProfileConfigurationModal: (show: boolean) => void;
    showPreferencesModal: boolean;
    setShowPreferencesModal: (show: boolean) => void;
    showAboutModal: boolean;
    setShowAboutModal: (show: boolean) => void;
    showAddConversationModal: boolean;
    setShowAddConversationModal: (show: boolean) => void;
    configureProfileModal: IConfigureProfileModal;
    setConfigureProfileModal: (modal: IConfigureProfileModal) => void;
    resetConfigureProfileModal: () => void;
    resetModalStates: () => void;
    preferencesOptionSelected: PreferencesOptionType | null;
    setPreferencesOptionSelected: (item: PreferencesOptionType | null) => void;
    preferencesOptions: PreferencesOptionType[];
    updatePreferenceSelected: (ticker: PREFERENCES_ITEMS | null) => void;
    disabledOptions: DisabledOptionsType;
    isProfileDialogDisabled: () => boolean;
};

export const ModalContext = React.createContext<ModalContextType>({
    loaderContent: '',
    setLoaderContent: (content: string) => {},
    contactToHide: undefined,
    setContactToHide: (action: string | undefined) => {},
    addConversation: {
        active: false,
        ensName: undefined,
        processed: false,
    },
    setAddConversation: (contact: NewContact) => {},
    openEmojiPopup: { action: false, data: undefined },
    setOpenEmojiPopup: (action: IOpenEmojiPopup) => {},
    lastMessageAction: MessageActionType.NONE,
    setLastMessageAction: (action: MessageActionType) => {},
    showProfileConfigurationModal: false,
    setShowProfileConfigurationModal: (show: boolean) => {},
    showPreferencesModal: false,
    setShowPreferencesModal: (show: boolean) => {},
    showAboutModal: false,
    setShowAboutModal: (show: boolean) => {},
    showAddConversationModal: false,
    setShowAddConversationModal: (show: boolean) => {},
    configureProfileModal: {
        profileOptionSelected: ProfileType.DM3_NAME,
        onScreen: ProfileScreenType.NONE,
    },
    setConfigureProfileModal: (modal: IConfigureProfileModal) => {},
    resetConfigureProfileModal: () => {},
    resetModalStates: () => {},
    preferencesOptionSelected: null,
    setPreferencesOptionSelected: (item: PreferencesOptionType | null) => {},
    preferencesOptions: [],
    updatePreferenceSelected: (ticker: PREFERENCES_ITEMS | null) => {},
    disabledOptions: {
        notification: {
            email: false,
            push: false,
        },
        profile: {
            dm3: [
                { key: 'dm3', value: false },
                { key: 'optimism', value: false },
            ],
            own: [
                { key: 'ens', value: false },
                { key: 'gnosis', value: false },
            ],
        },
        settings: {
            messageView: false,
        },
    },
    isProfileDialogDisabled: () => false,
});

export const ModalContextProvider = ({ children }: { children?: any }) => {
    const {
        loaderContent,
        setLoaderContent,
        contactToHide,
        setContactToHide,
        addConversation,
        setAddConversation,
        openEmojiPopup,
        setOpenEmojiPopup,
        lastMessageAction,
        setLastMessageAction,
        showProfileConfigurationModal,
        setShowProfileConfigurationModal,
        showPreferencesModal,
        setShowPreferencesModal,
        showAboutModal,
        setShowAboutModal,
        showAddConversationModal,
        setShowAddConversationModal,
        configureProfileModal,
        setConfigureProfileModal,
        resetConfigureProfileModal,
        preferencesOptionSelected,
        setPreferencesOptionSelected,
        preferencesOptions,
        updatePreferenceSelected,
        resetModalStates,
        disabledOptions,
        isProfileDialogDisabled,
    } = useModal();

    return (
        <ModalContext.Provider
            value={{
                loaderContent,
                setLoaderContent,
                contactToHide,
                setContactToHide,
                addConversation,
                setAddConversation,
                openEmojiPopup,
                setOpenEmojiPopup,
                lastMessageAction,
                setLastMessageAction,
                showProfileConfigurationModal,
                setShowProfileConfigurationModal,
                showPreferencesModal,
                setShowPreferencesModal,
                showAboutModal,
                setShowAboutModal,
                showAddConversationModal,
                setShowAddConversationModal,
                resetModalStates,
                configureProfileModal,
                setConfigureProfileModal,
                resetConfigureProfileModal,
                preferencesOptionSelected,
                setPreferencesOptionSelected,
                preferencesOptions,
                updatePreferenceSelected,
                disabledOptions,
                isProfileDialogDisabled,
            }}
        >
            {children}
        </ModalContext.Provider>
    );
};
