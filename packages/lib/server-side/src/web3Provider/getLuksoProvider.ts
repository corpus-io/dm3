import { ethers } from 'ethers';

export async function getLuksoProvider(
    env: NodeJS.ProcessEnv,
): Promise<ethers.providers.JsonRpcProvider> {
    const readKey = (keyName: string) => {
        const key = env[keyName];
        if (!key) {
            throw Error(`Missing ${keyName} in env`);
        }

        return key;
    };

    const rpc = readKey('LUKSO_RPC');
    return new ethers.providers.JsonRpcProvider(rpc);
}
