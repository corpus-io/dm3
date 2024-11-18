export * as schema from './schema';
export {
    checkStringSignature,
    checkUserProfile,
    checkUserProfileWithAddress,
    getAccountDisplayName,
    getBrowserStorageKey,
    getProfileCreationMessage,
    normalizeEnsName,
    isSameEnsName,
    PROFILE_RECORD_NAME,
    formatAddress,
    createProfile,
    DEFAULT_NONCE,
} from './Profile';

export type { Account, ProfileKeys, GetResource } from './Profile';
export type {
    SignedUserProfile,
    UserProfile,
    DeliveryServiceProfile,
    DeliveryServiceProfileKeys,
} from './types';
export * from './profileResolver';

export type { ProfileExtension } from './profileExtension';
export * from './profileExtension';
export { getUserProfile, hasUserProfile } from './userProfile/getUserProfile';
export {
    getDeliveryServiceClient,
    getDeliveryServiceProfile,
    createDeliveryServiceProfile,
} from './deliveryServiceProfile/Delivery';
export * from './profileKeys/createProfileKeys';
export * from './profileLink';
export * from './profileValidator/ProfileValidator';
