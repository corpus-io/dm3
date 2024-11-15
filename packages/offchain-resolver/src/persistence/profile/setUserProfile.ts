import { SignedUserProfile, schema } from '@dm3-org/dm3-lib-profile';
import { validateSchema } from '@dm3-org/dm3-lib-shared';
import { PrismaClient } from '@prisma/client';
import { createOrUpdateUserProfile } from './createOrUpdateUserProfile';

/**
 *
 * @param {Redis} redis - Redis client
 * @param {string} name - ENS name
 * @param {Lib.profile.UserProfile} profile - User Profile object
 * @param {string} address - Ethereum address
 * @returns {Promise<boolean>} - A promise that resolves to true if the profile is set successfully, false otherwise
 */
export function setUserProfile(db: PrismaClient) {
    return async (
        name: string,
        profile: SignedUserProfile,
        address: string,
    ) => {
        const profileIsValid = validateSchema(
            schema.SignedUserProfile,
            profile,
        );

        if (!profileIsValid) {
            throw Error('Invalid user profile');
        }

        try {
            await createOrUpdateUserProfile(db, name, profile, address);
            return true;
        } catch (e) {
            console.log('setUserProfile error ', e);
            return false;
        }
    };
}
