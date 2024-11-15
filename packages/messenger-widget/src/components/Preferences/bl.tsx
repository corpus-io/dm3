import propertiesIcon from './../../assets/images/properties.svg';
import dm3Icon from './../../assets/images/dm3.svg';
import spamIcon from './../../assets/images/spam.svg';
import notificationIcon from './../../assets/images/notification.svg';
import networkIcon from './../../assets/images/network.svg';
import storageIcon from './../../assets/images/storage.svg';
import settingsIcon from './../../assets/images/settings.svg';
import { Spam } from './Spam/Spam';
import { Properties } from './Properties/Properties';
import { Notification } from './Notification/Notification';
import { Network } from './Network/Network';
import { Storage } from './Storage/Storage';
import { DM3Profile } from './DM3Profile/DM3Profile';
import { Settings } from './Settings/Settings';

export enum PREFERENCES_ITEMS {
    PROPERTIES = 'PROPERTIES',
    DM3_PROFILE = 'DM3_PROFILE',
    SPAM = 'SPAM',
    NOTIFICATION = 'NOTIFICATION',
    NETWORK = 'NETWORK',
    STORAGE = 'STORAGE',
    SETTINGS = 'SETTINGS',
}

export const preferencesItems = [
    {
        icon: (
            <img
                src={propertiesIcon}
                alt="properties"
                className="pref-icon me-2"
            />
        ),
        name: 'Properties',
        component: <Properties />,
        ticker: PREFERENCES_ITEMS.PROPERTIES,
        isEnabled: false,
    },
    {
        icon: <img src={dm3Icon} alt="dm3" className="pref-icon me-2" />,
        name: 'dm3 Profile',
        component: <DM3Profile />,
        ticker: PREFERENCES_ITEMS.DM3_PROFILE,
        isEnabled: true,
    },
    {
        icon: <img src={spamIcon} alt="spam" className="pref-icon me-2" />,
        name: 'Spam Protection',
        component: <Spam />,
        ticker: PREFERENCES_ITEMS.SPAM,
        isEnabled: false,
    },
    {
        icon: (
            <img
                src={notificationIcon}
                alt="notification"
                className="pref-icon me-2"
            />
        ),
        name: 'Notification',
        component: <Notification />,
        ticker: PREFERENCES_ITEMS.NOTIFICATION,
        isEnabled: true,
    },
    {
        icon: (
            <img src={networkIcon} alt="network" className="pref-icon me-2" />
        ),
        name: 'Network',
        component: <Network />,
        ticker: PREFERENCES_ITEMS.NETWORK,
        isEnabled: true,
    },
    {
        icon: (
            <img src={storageIcon} alt="storage" className="pref-icon me-2" />
        ),
        name: 'Storage',
        component: <Storage />,
        ticker: PREFERENCES_ITEMS.STORAGE,
        isEnabled: false,
    },
    {
        icon: (
            <img src={settingsIcon} alt="network" className="pref-icon me-2" />
        ),
        name: 'Settings',
        ticker: PREFERENCES_ITEMS.SETTINGS,
        component: <Settings />,
        isEnabled: true,
    },
];
