import { ProfileExtension, SignedUserProfile } from '@dm3-org/dm3-lib-profile';
import { SpamFilterRules } from './spam-filter';

//1Year
const TTL = 31536000000;

export interface Account {
    account: string;
    signedUserProfile: SignedUserProfile;
    token: string;
    publicMessageHeadUri?: string;
    createdAt: number;
    socketId?: string;
    challenge?: string;
    profileExtension: ProfileExtension;
    //TODO use SpamFilterRules once spam-filer is ready
    spamFilterRules?: SpamFilterRules;
}
