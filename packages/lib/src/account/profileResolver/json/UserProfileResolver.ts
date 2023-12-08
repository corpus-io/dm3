import { log } from '../../..';
import { UserProfile, SignedUserProfile } from '../../Account';

function isProfile(textRecord: string) {
    try {
        const { profile, signature } = JSON.parse(textRecord);
        const {
            publicEncryptionKey,
            publicSigningKey,
            deliveryServices,
        }: Partial<UserProfile> = profile;

        // eslint-disable-next-line max-len
        //If the profile string contains all 3 mandatory fields, and the according signature the string can be considered valid
        return !!(
            signature &&
            publicEncryptionKey &&
            publicSigningKey &&
            deliveryServices
        );
    } catch (e) {
        return false;
    }
}

async function resolveProfile(textRecord: string) {
    log(`[getUserProfile] Resolve User Json profile `);

    const { profile, signature } = JSON.parse(textRecord);
    const {
        publicEncryptionKey,
        publicSigningKey,
        deliveryServices,
        mutableProfileExtensionUrl,
    }: Partial<UserProfile> = profile;

    return {
        profile: {
            publicEncryptionKey,
            publicSigningKey,
            deliveryServices,
            mutableProfileExtensionUrl,
        },
        signature,
    } as SignedUserProfile;
}

export function UserProfileResolver() {
    return {
        isProfile,
        resolveProfile,
    };
}
