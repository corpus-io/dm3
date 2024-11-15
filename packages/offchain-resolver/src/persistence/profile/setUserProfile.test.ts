import { getDatabase, getDbClient } from '../getDatabase';
import { IDatabase } from '../IDatabase';
import { setUserProfile } from './setUserProfile';
import { ethers } from 'ethers';
import { SignedUserProfile } from '@dm3-org/dm3-lib-profile';
import { PrismaClient } from '@prisma/client';
import { clearDb } from '../clearDb';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { getProfileContainer } from './getProfileContainer';

chai.use(chaiAsPromised);

describe('setUserProfile', () => {
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

    it('Rejects invalid user profile', async () => {
        const { address } = ethers.Wallet.createRandom();

        expect(
            setUserProfile(prismaClient)(
                'foo.eth',
                {} as SignedUserProfile,
                address,
            ),
        ).to.be.rejectedWith(Error('Invalid user profile'));
    });
    it('Stores valid user profile', async () => {
        const { address } = ethers.Wallet.createRandom();

        const profile: SignedUserProfile = {
            signature:
                '0x0a46a1cc2a44c28f7415ba4b5a7d0af313a88ea2283f7374edecc705eece8' +
                '97009cbf930d6f7d63dc915de219f717accb4acca10cf2b38845d1bfd20649bb1fa1b',
            profile: {
                publicSigningKey:
                    '0ekgI3CBw2iXNXudRdBQHiOaMpG9bvq9Jse26dButug=',
                publicEncryptionKey:
                    'Vrd/eTAk/jZb/w5L408yDjOO5upNFDGdt0lyWRjfBEk=',
                deliveryServices: [''],
            },
        };

        const writeResult = await setUserProfile(prismaClient)(
            'foo.eth',
            profile,
            address,
        );

        expect(writeResult).to.be.true;
    });
    it('Updates the profile if it already exists', async () => {
        const { address } = ethers.Wallet.createRandom();

        const profile: SignedUserProfile = {
            signature:
                '0x0a46a1cc2a44c28f7415ba4b5a7d0af313a88ea2283f7374ed' +
                'ecc705eece897009cbf930d6f7d63dc915de219f717accb4acca10cf2b38845d1bfd20649bb1fa1b',
            profile: {
                publicSigningKey:
                    '0ekgI3CBw2iXNXudRdBQHiOaMpG9bvq9Jse26dButug=',
                publicEncryptionKey:
                    'Vrd/eTAk/jZb/w5L408yDjOO5upNFDGdt0lyWRjfBEk=',
                deliveryServices: [''],
            },
        };
        //This should pass
        const firstWrite = await setUserProfile(prismaClient)(
            'foo.eth',
            profile,
            address,
        );
        expect(firstWrite).to.be.true;

        // add new DS to the profile
        const newProfile: SignedUserProfile = { ...profile };
        newProfile.profile.deliveryServices = ['ds.eth'];

        //This should reject bc the subdomain already has a profile
        const secondWrite = await setUserProfile(prismaClient)(
            'foo.eth',
            newProfile,
            address,
        );

        const retrievedProfile = await getProfileContainer(prismaClient)(
            'foo.eth',
        );

        expect(secondWrite).to.be.true;
        expect(JSON.stringify(retrievedProfile?.profile)).to.equal(
            JSON.stringify(newProfile),
        );
    });
});
