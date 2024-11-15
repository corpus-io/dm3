import { SignedUserProfile } from '@dm3-org/dm3-lib-profile';
import { ethers } from 'ethers';

import { getProfileContainer, setUserProfile } from '.';
import { IDatabase } from '../IDatabase';
import { getDatabase, getDbClient } from '../getDatabase';

import { PrismaClient } from '@prisma/client';
import { clearDb } from '../clearDb';
const { expect } = require('chai');

describe('getUserProfile', () => {
    let prismaClient: PrismaClient;
    let db: IDatabase;

    beforeEach(async () => {
        prismaClient = await getDbClient();
        db = await getDatabase(prismaClient);
        await clearDb(prismaClient);
    });

    afterEach(async () => {
        await clearDb(prismaClient);
        prismaClient.$disconnect();
    });

    it('Returns null if the name has no profile yet', async () => {
        const profile = await getProfileContainer(prismaClient)('foo');
        expect(profile).to.be.null;
    });

    it('Returns the profile if a name has one', async () => {
        const name = 'foo.eth';
        const { address } = ethers.Wallet.createRandom();

        const profile: SignedUserProfile = {
            signature:
                '0x0a46a1cc2a44c28f7415ba4b5a7d0af313a88ea2283f7374edecc' +
                '705eece897009cbf930d6f7d63dc915de219f717accb4acca10cf2b38845d1bfd20649bb1fa1b',
            profile: {
                publicSigningKey:
                    '0ekgI3CBw2iXNXudRdBQHiOaMpG9bvq9Jse26dButug=',
                publicEncryptionKey:
                    'Vrd/eTAk/jZb/w5L408yDjOO5upNFDGdt0lyWRjfBEk=',
                deliveryServices: [''],
            },
        };

        await setUserProfile(prismaClient)(name, profile, address);
        const retrievedProfile = await getProfileContainer(prismaClient)(name);

        expect(retrievedProfile?.profile).to.eql(profile);
    });
});
