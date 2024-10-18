import {
    Account,
    DeliveryServiceProfile,
    getAccountDisplayName,
} from '@dm3-org/dm3-lib-profile';

export interface Contact {
    account: Account;
    deliveryServiceProfiles: DeliveryServiceProfile[];
}

export interface ContactPreview {
    name: string;
    contactProfileLocation: string[];
    message: string | undefined;
    image: string;
    contactDetails: Contact;
    isHidden: boolean;
    messageSizeLimit: number;
    updatedAt: number;
}

export const getEmptyContact = (
    ensName: string,
    message: string | undefined,
    isHidden: boolean = false,
    updatedAt: number,
    contactProfileLocation: string[],
) => {
    const newContact: ContactPreview = {
        name: getAccountDisplayName(ensName, 25),
        contactProfileLocation,
        message,
        image: '',
        contactDetails: {
            account: {
                ensName,
            },
            deliveryServiceProfiles: [],
        },
        isHidden,
        messageSizeLimit: 0,
        updatedAt: updatedAt,
    };

    return newContact;
};
