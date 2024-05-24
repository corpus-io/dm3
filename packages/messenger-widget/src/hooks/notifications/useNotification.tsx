import { useContext, useEffect, useState } from 'react';
import { log } from '@dm3-org/dm3-lib-shared';
import {
    addNotificationChannel,
    getAllNotificationChannels,
    getGlobalNotification,
    removeNotificationChannel,
    toggleGlobalNotifications,
    toggleNotificationChannel,
} from '@dm3-org/dm3-lib-delivery-api';
import {
    NotificationChannel,
    NotificationChannelType,
} from '@dm3-org/dm3-lib-shared';
import { AuthContext } from '../../context/AuthContext';
import { useMainnetProvider } from '../mainnetprovider/useMainnetProvider';
import { IVerificationModal } from '../../components/Preferences/Notification/VerificationModal';
import { getVerficationModalContent } from '../../components/Preferences/Notification/hooks/VerificationContent';
import { DM3ConfigurationContext } from '../../context/DM3ConfigurationContext';

export const useNotification = () => {
    const mainnetProvider = useMainnetProvider();

    const { account, deliveryServiceToken } = useContext(AuthContext);
    const { dm3Configuration } = useContext(DM3ConfigurationContext);

    // States for active notifications
    const [isNotificationsActive, setIsNotificationsActive] =
        useState<boolean>(false);
    const [isEmailActive, setIsEmailActive] = useState<boolean>(false);
    const [isMobileActive, setIsMobileActive] = useState<boolean>(false);
    const [isPushNotifyActive, setIsPushNotifyActive] =
        useState<boolean>(false);

    // States to manage email & phone no.
    const [email, setEmail] = useState<string | null>(null);
    const [phone, setPhone] = useState<string | null>(null);

    // States related to popup for verification
    const [activeVerification, setActiveVerification] = useState<
        NotificationChannelType | undefined
    >(undefined);

    // States to handle loader in notification screen
    const [isLoading, setIsloading] = useState<boolean>(false);
    const [loaderData, setLoaderData] = useState<string>('');

    const [activeVerificationContent, setActiveVerificationContent] =
        useState<IVerificationModal>(
            getVerficationModalContent(
                NotificationChannelType.EMAIL,
                setActiveVerification,
                setEmail,
            ),
        );

    const updateNotificationActive = async (action: boolean) => {
        setIsNotificationsActive(action);
        setIsEmailActive(action);
        setIsMobileActive(action);
        setIsPushNotifyActive(action);
        toggleGlobalChannel(action);
    };

    // Fetches and sets global notification
    const fetchGlobalNotification = async () => {
        if (account && deliveryServiceToken) {
            try {
                const { data, status } = await getGlobalNotification(
                    account,
                    mainnetProvider,
                    deliveryServiceToken,
                    dm3Configuration.backendUrl,
                );
                if (status === 200) {
                    setIsNotificationsActive(data.isEnabled);
                    await fetchUserNotificationChannels();
                }
            } catch (error) {
                log(`Failed to fetch global notification : ${error}`, 'error');
            }
        }
    };

    // Fetches and sets all notification channels
    const fetchUserNotificationChannels = async () => {
        if (account && deliveryServiceToken) {
            try {
                const { data, status } = await getAllNotificationChannels(
                    account,
                    mainnetProvider,
                    deliveryServiceToken,
                    dm3Configuration.backendUrl,
                );
                if (status === 200) {
                    data.notificationChannels.forEach(
                        (channel: NotificationChannel) => {
                            switch (channel.type) {
                                case NotificationChannelType.EMAIL:
                                    if (channel.config.isVerified) {
                                        setEmail(channel.config.recipientValue);
                                    }
                                    setIsEmailActive(channel.config.isEnabled);
                                    break;
                                case NotificationChannelType.PUSH:
                                    setIsPushNotifyActive(
                                        channel.config.isEnabled,
                                    );
                                    break;
                                default:
                                    break;
                            }
                        },
                    );
                }
            } catch (error) {
                log(
                    `Failed to fetch notification channels : ${error}`,
                    'error',
                );
            }
        }
    };

    // Toggles global notification channel
    const toggleGlobalChannel = async (isEnabled: boolean) => {
        if (account && deliveryServiceToken) {
            try {
                setLoaderData('Configuring global notification ...');
                setIsloading(true);
                const { status } = await toggleGlobalNotifications(
                    account,
                    mainnetProvider,
                    deliveryServiceToken,
                    isEnabled,
                    dm3Configuration.backendUrl,
                );
                if (status === 200 && isEnabled) {
                    await fetchUserNotificationChannels();
                }
                setIsloading(false);
            } catch (error) {
                log(`Failed to toggle global channel : ${error}`, 'error');
                setIsloading(false);
            }
        }
    };

    // Toggles specific notification channel
    const toggleSpecificNotificationChannel = async (
        isEnabled: boolean,
        notificationChannelType: NotificationChannelType,
        setChannelEnabled: (action: boolean) => void,
    ) => {
        if (account && deliveryServiceToken) {
            try {
                setChannelEnabled(isEnabled);
                const { status } = await toggleNotificationChannel(
                    account,
                    mainnetProvider,
                    deliveryServiceToken,
                    isEnabled,
                    notificationChannelType,
                    dm3Configuration.backendUrl,
                );
                if (isEnabled && status === 200) {
                    await fetchUserNotificationChannels();
                }
            } catch (error) {
                log(
                    `Failed to toggle notification channel : ${error}`,
                    'error',
                );
            }
        }
    };

    // Enable push notification channel
    const enablePushNotificationChannel = async () => {
        if (account && deliveryServiceToken) {
            try {
                setLoaderData('Configuring push notifications...');
                setIsloading(true);
                const subscription = await subscribeToPushNotification(
                    dm3Configuration.publicVapidKey,
                );

                if (!subscription)
                    throw new Error('Failed to subscribe webpush notification');

                const { status } = await addNotificationChannel(
                    account,
                    mainnetProvider,
                    deliveryServiceToken,
                    subscription,
                    NotificationChannelType.PUSH,
                    dm3Configuration.backendUrl,
                );

                if (status === 200) {
                    await fetchUserNotificationChannels();
                }
                setIsloading(false);
            } catch (error) {
                log(
                    `Failed to toggle push notification channel : ${error}`,
                    'error',
                );
                setIsloading(false);
            }
        }
    };

    // Remove specific notification channel
    const removeSpecificNotificationChannel = async (
        channelType: NotificationChannelType,
        resetChannel: (action: null) => void,
    ) => {
        if (account && deliveryServiceToken) {
            try {
                setLoaderData(
                    `Removing ${channelType.toLowerCase()} channel...`,
                );
                setIsloading(true);
                const { status } = await removeNotificationChannel(
                    account,
                    mainnetProvider,
                    deliveryServiceToken,
                    channelType,
                    dm3Configuration.backendUrl,
                );
                if (status === 200) {
                    resetChannel(null);
                }
                setIsloading(false);
            } catch (error) {
                log(
                    `Failed to remove notification channel : ${error}`,
                    'error',
                );
                setIsloading(false);
            }
        }
    };

    const subscribeToPushNotification = async (
        publicVapidKey: string,
    ): Promise<PushSubscription | undefined> => {
        if ('serviceWorker' in navigator) {
            console.log('Registering service worker...');
            const registration = await navigator.serviceWorker.register(
                './../../service-worker.js',
                { scope: '/' },
            );
            console.log('Registered service worker...');

            const subscription: PushSubscription =
                await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: publicVapidKey,
                });

            console.log('Registered push...');

            // on subscribing notification, requests to enable browser notification if not enabled
            requestNotificationPermission();
            return subscription;
        }
    };

    const requestNotificationPermission = async () => {
        console.log('Notification.permission : ', Notification.permission);
        if (!('Notification' in window)) {
            console.log('This browser does not support notifications...');
            return;
        }
        if (Notification.permission === 'granted') {
            console.log('Push notification permission already granted...');
            return;
        }

        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            console.log('Push notification permission granted...');
        }
    };

    useEffect(() => {
        const fetchNotificationDetails = async () => {
            await fetchGlobalNotification();
        };
        fetchNotificationDetails();
    }, []);

    // add/remove the push notification based in checkbox tick
    useEffect(() => {
        if (isPushNotifyActive) {
            enablePushNotificationChannel();
        } else {
            removeSpecificNotificationChannel(
                NotificationChannelType.PUSH,
                () => {},
            );
        }
    }, [isPushNotifyActive]);

    return {
        isNotificationsActive,
        isEmailActive,
        setIsEmailActive,
        isMobileActive,
        setIsMobileActive,
        isPushNotifyActive,
        setIsPushNotifyActive,
        email,
        setEmail,
        phone,
        setPhone,
        updateNotificationActive,
        activeVerification,
        setActiveVerification,
        activeVerificationContent,
        setActiveVerificationContent,
        toggleSpecificNotificationChannel,
        removeSpecificNotificationChannel,
        isLoading,
        loaderData,
    };
};
