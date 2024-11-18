import { ethers } from 'ethers';
import { readKeyFromEnv } from './readKeyEnv';

export function getLuksoProvider(): ethers.providers.BaseProvider {
    const rpc = readKeyFromEnv('LUKSO_RPC');
    return new ethers.providers.JsonRpcProvider(rpc);
}
