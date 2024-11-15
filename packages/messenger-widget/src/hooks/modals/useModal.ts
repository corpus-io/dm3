import { useContext, useEffect, useState } from 'react';
import { NewContact } from '../../interfaces/utils';
import { MessageProps } from '../../interfaces/props';
import {
    MessageActionType,
    ProfileScreenType,
    ProfileType,
} from '../../utils/enum-type-utils';
import {
    PREFERENCES_ITEMS,
    preferencesItems,
} from '../../components/Preferences/bl';
import { DM3ConfigurationContext } from '../../context/DM3ConfigurationContext';

export interface IOpenEmojiPopup {
    action: boolean;
    data: MessageProps | undefined;
}

export interface IConfigureProfileModal {
    profileOptionSelected: ProfileType;
    onScreen: ProfileScreenType;
}

export type PreferencesOptionType = {
    icon: JSX.Element;
    name: string;
    component: JSX.Element;
    isEnabled: boolean;
    ticker: PREFERENCES_ITEMS;
};

export type DisabledOptionsType = {
    notification: {
        email: boolean;
        push: boolean;
    };
    profile: {
        dm3: { key: string; value: boolean }[];
        own: { key: string; value: boolean }[];
    };
    settings: {
        messageView: boolean;
    };
};

export const useModal = () => {
    const [loaderContent, setLoaderContent] = useState<string>('');

    const [contactToHide, setContactToHide] = useState<string | undefined>(
        undefined,
    );

    const [addConversation, setAddConversation] = useState<NewContact>({
        active: false,
        ensName: undefined,
        processed: false,
    });

    const [openEmojiPopup, setOpenEmojiPopup] = useState<IOpenEmojiPopup>({
        action: false,
        data: undefined,
    });

    const [lastMessageAction, setLastMessageAction] =
        useState<MessageActionType>(MessageActionType.NONE);

    const [showProfileConfigurationModal, setShowProfileConfigurationModal] =
        useState<boolean>(false);

    const [showPreferencesModal, setShowPreferencesModal] =
        useState<boolean>(false);

    const [showAddConversationModal, setShowAddConversationModal] =
        useState<boolean>(false);

    const [showAboutModal, setShowAboutModal] = useState<boolean>(false);

    const [configureProfileModal, setConfigureProfileModal] =
        useState<IConfigureProfileModal>({
            profileOptionSelected: ProfileType.DM3_NAME,
            onScreen: ProfileScreenType.NONE,
        });

    const [preferencesOptions, setPreferencesOptions] = useState<
        PreferencesOptionType[]
    >([]);

    const [preferencesOptionSelected, setPreferencesOptionSelected] =
        useState<PreferencesOptionType | null>(null);

    const [disabledOptions, setDisabledOptions] = useState<DisabledOptionsType>(
        {
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
    );

    const { dm3Configuration } = useContext(DM3ConfigurationContext);

    const resetConfigureProfileModal = () => {
        setConfigureProfileModal({
            profileOptionSelected: ProfileType.DM3_NAME,
            onScreen: ProfileScreenType.NONE,
        });
    };
    const resetModalStates = () => {
        setLoaderContent('');
        setContactToHide(undefined);
        setAddConversation({
            active: false,
            ensName: undefined,
            processed: false,
        });
        setOpenEmojiPopup({ action: false, data: undefined });
        setLastMessageAction(MessageActionType.NONE);
        setShowProfileConfigurationModal(false);
        setShowPreferencesModal(false);
        setShowAboutModal(false);
        setShowAddConversationModal(false);
        setConfigureProfileModal({
            profileOptionSelected: ProfileType.DM3_NAME,
            onScreen: ProfileScreenType.NONE,
        });
        setPreferencesOptions(preferencesItems);
        setPreferencesOptionSelected(null);
    };

    const configureOptionsOfPreferences = () => {
        const prefState = [...preferencesItems];
        const optionsToDisable = { ...disabledOptions };
        const dialogDisabled = dm3Configuration.disableDialogOptions;

        // disable all properties of preferences config
        if (dialogDisabled !== undefined && dialogDisabled === true) {
            const disabledOptions = prefState.map((p) => {
                return {
                    ...p,
                    isEnabled: false,
                };
            });
            setPreferencesOptions(disabledOptions);
            return;
        }

        // disable specific properties of dialog
        if (
            dialogDisabled !== undefined &&
            typeof dialogDisabled === 'object'
        ) {
            // update network dialog
            const updatedNetworkOptions = prefState.map((pref) => {
                return {
                    ...pref,
                    isEnabled:
                        pref.ticker === PREFERENCES_ITEMS.NETWORK
                            ? !dialogDisabled.network ?? pref.isEnabled
                            : pref.isEnabled,
                };
            });

            // update notification dialog
            const updatedNotificationOptions =
                dialogDisabled.notification === true
                    ? updatedNetworkOptions.map((pref) => {
                          return {
                              ...pref,
                              isEnabled:
                                  pref.ticker === PREFERENCES_ITEMS.NOTIFICATION
                                      ? false
                                      : pref.isEnabled,
                          };
                      })
                    : updatedNetworkOptions;

            // update profile dialog
            let updatedProfileOptions = updatedNotificationOptions;

            // disable profile dialog
            if (dialogDisabled.profile === true) {
                updatedProfileOptions = updatedNotificationOptions.map(
                    (pref) => {
                        return {
                            ...pref,
                            isEnabled:
                                pref.ticker === PREFERENCES_ITEMS.DM3_PROFILE
                                    ? false
                                    : pref.isEnabled,
                        };
                    },
                );
                optionsToDisable.profile.dm3[0].value = true;
                optionsToDisable.profile.dm3[1].value = true;
                optionsToDisable.profile.own[0].value = true;
                optionsToDisable.profile.own[1].value = true;
            }

            // disable specific notification type
            if (typeof dialogDisabled.notification === 'object') {
                optionsToDisable.notification.email =
                    dialogDisabled.notification.email ?? false;
                optionsToDisable.notification.push =
                    dialogDisabled.notification.push ?? false;
            }

            // disable specific profile type
            if (typeof dialogDisabled.profile === 'object') {
                // if entire dm3 profile (dm3name and optimism) is disabled/enabled
                if (typeof dialogDisabled.profile.dm3 === 'boolean') {
                    optionsToDisable.profile.dm3[0].value =
                        dialogDisabled.profile.dm3;
                    optionsToDisable.profile.dm3[1].value =
                        dialogDisabled.profile.dm3;
                }

                // if specific dm3name or optimism profile is disabled/enabled
                if (typeof dialogDisabled.profile.dm3 === 'object') {
                    optionsToDisable.profile.dm3[0].value =
                        dialogDisabled.profile.dm3.cloud ?? false;
                    optionsToDisable.profile.dm3[1].value =
                        dialogDisabled.profile.dm3.optimism ?? false;
                }

                // if entire self profile (ens and gnosis) is disabled/enabled
                if (typeof dialogDisabled.profile.self === 'boolean') {
                    optionsToDisable.profile.own[0].value =
                        dialogDisabled.profile.self;
                    optionsToDisable.profile.own[1].value =
                        dialogDisabled.profile.self;
                }

                // if specific ens or gnosis profile is disabled/enabled
                if (typeof dialogDisabled.profile.self === 'object') {
                    optionsToDisable.profile.own[0].value =
                        dialogDisabled.profile.self.ens ?? false;
                    optionsToDisable.profile.own[1].value =
                        dialogDisabled.profile.self.gnosis ?? false;
                }
            }

            // update settings dialog
            const updatedSettingsOptions =
                dialogDisabled.settings === true
                    ? updatedProfileOptions.map((pref) => {
                          return {
                              ...pref,
                              isEnabled:
                                  pref.ticker === PREFERENCES_ITEMS.SETTINGS
                                      ? false
                                      : pref.isEnabled,
                          };
                      })
                    : updatedProfileOptions;

            // disable specific settings option
            if (typeof dialogDisabled.settings === 'object') {
                optionsToDisable.settings.messageView =
                    dialogDisabled.settings.messageView ?? false;
            }

            // update the states for disabled options
            setDisabledOptions(optionsToDisable);
            setPreferencesOptions(
                updatedSettingsOptions as PreferencesOptionType[],
            );

            return;
        }

        // update the preferences options as per configuration
        setPreferencesOptions(prefState);
    };

    const updatePreferenceSelected = (ticker: PREFERENCES_ITEMS | null) => {
        setPreferencesOptionSelected(
            ticker
                ? preferencesOptions.find(
                      (p) => p.ticker === ticker && p.isEnabled,
                  ) ?? null
                : null,
        );
    };

    const isProfileDialogDisabled = () => {
        const disabledDm3Profile = disabledOptions.profile.dm3.filter(
            (d) => !d.value,
        );
        const disabledOwnProfile = disabledOptions.profile.own.filter(
            (d) => !d.value,
        );
        // if atleast one profile is enabled
        if (disabledDm3Profile.length || disabledOwnProfile.length) {
            return false;
        }
        return true;
    };

    // configure dialog to show properties in preferences modal
    useEffect(() => {
        configureOptionsOfPreferences();
    }, [dm3Configuration]);

    return {
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
    };
};
