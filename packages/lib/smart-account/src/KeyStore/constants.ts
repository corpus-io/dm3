import { ethers } from 'ethers';
const { toUtf8Bytes, keccak256 } = ethers.utils;

export const DM3_KEYSTORE_KEY = keccak256(toUtf8Bytes('network.dm3.keyStore'));
export const DM3_PROFILE_KEY = keccak256(toUtf8Bytes('network.dm3.profile'));
