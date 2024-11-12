import {
    Account,
    DeliveryServiceProfile,
    getAccountDisplayName,
} from '@dm3-org/dm3-lib-profile';

class Messages {
    public readonly list: string[];
    public addMessage(message: string) {}
}

interface Contact {
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
        previewMessage: message,
        image: '',
        account: {
            ensName,
        },
        deliveryServiceProfiles: [],
        isHidden,
        messageSizeLimit: 0,
        updatedAt: updatedAt,
    };

    return newContact;
};
