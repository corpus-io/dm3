import { ethers } from 'ethers';
import { v4 as uuidv4 } from 'uuid';
import { PrismaClient } from '@prisma/client';
import {
    formatAddress,
    normalizeEnsName,
    SignedUserProfile,
} from '@dm3-org/dm3-lib-profile';

export const createOrUpdateUserProfile = async (
    db: PrismaClient,
    name: string,
    profile: SignedUserProfile,
    address: string,
) => {
    // hash the name
    const hashedName = ethers.utils.namehash(name);

    //Check if profile already exists
    const profileContainer = await db.profileContainer.findUnique({
        where: {
            nameHash: hashedName,
        },
    });

    if (profileContainer) {
        console.debug({
            message: 'pre updateUserProfile',
            hashedName,
            profile: JSON.stringify(profile),
            address: formatAddress(address),
        });

        //If a profile already exist. Update the profile property.
        //At the moemnt this is the only updatable field
        const updatedProfile = await db.profileContainer.update({
            where: {
                nameHash: hashedName,
            },
            data: {
                profile: JSON.stringify(profile),
            },
        });

        return updatedProfile;
    }

    // If profile does not exist, create it
    const id = uuidv4();

    console.debug({
        message: 'pre setUserProfile',
        id,
        hashedName,
        profile: JSON.stringify(profile),
        address: formatAddress(address),
        ensName: normalizeEnsName(name),
    });

    return await db.profileContainer.create({
        data: {
            id,
            nameHash: hashedName,
            profile: JSON.stringify(profile),
            address: formatAddress(address),
            ensName: normalizeEnsName(name),
        },
    });
};
