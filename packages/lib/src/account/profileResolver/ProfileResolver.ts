import { SignedUserProfile } from '../../../dist';

export type ProfileResolver = {
    //Determines if the certain resolver is capable of resolving the according textRecord
    isProfile: (textRecord: string) => boolean;
    //resolves a textRecord to a userProfile if isProfile evaluates to true
    resolveProfile: (
        textRecord: string,
    ) => Promise<SignedUserProfile | undefined>;
};
