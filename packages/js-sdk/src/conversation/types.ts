import {
    Account,
    DeliveryServiceProfile,
    getAccountDisplayName,
} from '@dm3-org/dm3-lib-profile';
import { Messages } from '../message/Messages';

export interface Contact {
    name: string;
    contactProfileLocation: string[];
    image: string;
    isHidden: boolean;
    messageSizeLimit: number;
    updatedAt: number;
    account: Account;
    deliveryServiceProfiles: DeliveryServiceProfile[];
}
export interface Conversation {
    messages: Messages;
    contact: Contact;
}

export const getEmptyContact = (
    ensName: string,
    message: string | undefined,
    isHidden: boolean = false,
    updatedAt: number,
    contactProfileLocation: string[],
) => {
    const newContact: Contact = {
        name: getAccountDisplayName(ensName, 25),
        contactProfileLocation,
        image: '',
        account: {
            ensName,
        },
        deliveryServiceProfiles: [],
        isHidden: false,
        messageSizeLimit: 0,
        updatedAt: updatedAt,
    };

    return newContact;
};
