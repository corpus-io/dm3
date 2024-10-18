import {
    Account,
    getUserProfile,
    normalizeEnsName,
} from '@dm3-org/dm3-lib-profile';
import { Conversation } from '@dm3-org/dm3-lib-storage/dist/new/types';
import { ethers } from 'ethers';
import { fetchMessageSizeLimit } from './fetchSizeLimit';
import { Contact, ContactPreview } from '../types';
import { fetchDsProfiles } from './fetchDsProfiles';

export const hydrateContract = async (
    provider: ethers.providers.JsonRpcProvider,
    conversation: Conversation,
    resolveAliasToTLD: (
        alias: string,
        foreinTldName?: string,
    ) => Promise<string>,
    addrEnsSubdomain: string,
) => {
    //If the profile property of the account is defined the user has already used DM3 previously
    const account = await _fetchUserProfile(provider, conversation);
    //Has to become fetchMultipleDsProfiles
    const contact = await fetchDsProfiles(provider, account);

    //get the maximum size limit by looking for the smallest size limit of every ds
    const maximumSizeLimit = await fetchMessageSizeLimit(
        contact.deliveryServiceProfiles,
    );
    const contactPreview = await _fetchContactPreview(
        provider,
        conversation,
        contact,
        resolveAliasToTLD,
        maximumSizeLimit,
        addrEnsSubdomain,
    );
    return contactPreview;
};

const _fetchContactPreview = async (
    provider: ethers.providers.JsonRpcProvider,
    conversation: Conversation,
    contact: Contact,
    resolveAliasToTLD: (
        alias: string,
        foreinTldName?: string,
    ) => Promise<string>,
    messageSizeLimit: number,
    addrEnsSubdomain: string,
): Promise<ContactPreview> => {
    return {
        //display name, if alias is not defined the addr ens name will be used
        name: await resolveAliasToTLD(
            contact.account.ensName,
            //in case the contact is a foreign contact the last known profile location is used
            conversation.contactProfileLocation[
                conversation.contactProfileLocation.length - 1
            ],
        ),
        contactProfileLocation: conversation.contactProfileLocation,
        message: conversation.previewMessage?.envelop.message.message,
        image: '',
        contactDetails: contact,
        isHidden: conversation.isHidden,
        messageSizeLimit: messageSizeLimit,
        updatedAt: conversation.updatedAt,
    };
};

const _fetchUserProfile = async (
    provider: ethers.providers.JsonRpcProvider,
    conversation: Conversation,
): Promise<Account> => {
    //At first we've to normalize the ENS names
    const normalizedContractName = normalizeEnsName(
        conversation.contactEnsName,
    );

    try {
        //At first we try to fetch the user profile using the normalized ENS name.
        //That returns the user profile of every user that has used Dm3 in the same namespace as the account
        //i.e if alice.dm3.eth is the account it can find profiles for users in the .dm3.eth namespace like bob.m3.eth
        const userProfile = await getUserProfile(
            provider!,
            normalizedContractName,
        );
        //Foreign profiles however could not be fetched with that approach.
        //Hence the conversation stores a field with the last known profile location of the contact

        if (userProfile) {
            return {
                ensName: normalizedContractName,
                profileSignature: userProfile.signature,
                profile: userProfile.profile,
            };
        }
        const foreignUserProfile = await getUserProfile(
            provider!,
            //contactProfileLocation is an array of the last known profile locations of the contcts profile
            conversation.contactProfileLocation[
                conversation.contactProfileLocation.length - 1
            ],
        );

        if (foreignUserProfile) {
            return {
                ensName: normalizedContractName,
                profileSignature: foreignUserProfile.signature,
                profile: foreignUserProfile.profile,
            };
        }
        //If no profile can be found we return an empty profile. That mos likely means the user has never used DM3 before

        return {
            ensName: normalizedContractName,
            profileSignature: undefined,
            profile: undefined,
        };
    } catch (err) {
        console.log(
            'unable to fetch user profile for ',
            conversation.contactEnsName,
        );
        return {
            ensName: normalizedContractName,
            profileSignature: undefined,
            profile: undefined,
        };
    }
};
