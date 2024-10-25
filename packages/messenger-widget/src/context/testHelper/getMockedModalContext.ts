import { ModalContextType } from '../ModalContext';
import { NewContact } from './../../interfaces/utils';
import {
    MessageActionType,
    ProfileScreenType,
    ProfileType,
} from './../../utils/enum-type-utils';
import {
    IConfigureProfileModal,
    IOpenEmojiPopup,
    PreferencesOptionType,
} from './../../hooks/modals/useModal';
import { PREFERENCES_ITEMS } from './../../components/Preferences/bl';

//Provide a mocked Modal context
//Override the default values with the provided values
export const getMockedModalContext = (override?: Partial<ModalContextType>) => {
    const defaultValues = {
        loaderContent: '',
        setLoaderContent: (content: string) => {
            throw new Error('Function not implemented.');
        },
        contactToHide: undefined,
        setContactToHide: (action: string | undefined) => {
            throw new Error('Function not implemented.');
        },
        addConversation: {
            active: false,
            ensName: undefined,
            processed: false,
        },
        setAddConversation: (contact: NewContact) => {
            throw new Error('Function not implemented.');
        },
        openEmojiPopup: { action: false, data: undefined },
        setOpenEmojiPopup: (action: IOpenEmojiPopup) => {
            throw new Error('Function not implemented.');
        },
        lastMessageAction: MessageActionType.NONE,
        setLastMessageAction: (action: MessageActionType) => {
            throw new Error('Function not implemented.');
        },
        showProfileConfigurationModal: false,
        setShowProfileConfigurationModal: (show: boolean) => {
            throw new Error('Function not implemented.');
        },
        showPreferencesModal: false,
        setShowPreferencesModal: (show: boolean) => {
            throw new Error('Function not implemented.');
        },
        showAboutModal: false,
        setShowAboutModal: (show: boolean) => {
            throw new Error('Function not implemented.');
        },
        showAddConversationModal: false,
        setShowAddConversationModal: (show: boolean) => {
            throw new Error('Function not implemented.');
        },
        configureProfileModal: {
            profileOptionSelected: ProfileType.DM3_NAME,
            onScreen: ProfileScreenType.NONE,
        },
        setConfigureProfileModal: (modal: IConfigureProfileModal) => {
            throw new Error('Function not implemented.');
        },
        resetConfigureProfileModal: () => {
            throw new Error('Function not implemented.');
        },
        resetModalStates: () => {
            throw new Error('Function not implemented.');
        },
        preferencesOptionSelected: null,
        setPreferencesOptionSelected: (item: PreferencesOptionType | null) => {
            throw new Error('Function not implemented.');
        },
        preferencesOptions: [],
        updatePreferenceSelected: (ticker: PREFERENCES_ITEMS | null) => {
            throw new Error('Function not implemented.');
        },
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
    };

    return { ...defaultValues, ...override };
};
