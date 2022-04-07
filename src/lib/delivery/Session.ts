import { ProfileRegistryEntry } from '../account/Account';
import { formatAddress } from '../external-apis/InjectedWeb3API';
import { log } from '../shared/log';

export interface Session {
    account: string;
    profileRegistryEntrySignature: string;
    token: string;
    ttl?: undefined;
    socketId?: string;
    profileRegistryEntry: ProfileRegistryEntry;
}

export function checkToken(
    sessions: Map<string, Session>,
    accountAddress: string,
    token: string,
): boolean {
    const account = formatAddress(accountAddress);
    const session = sessions.get(account);
    const passed = session && session?.token === token;
    log(`- Token check for ${account}: ${passed ? 'PASSED' : 'FAILED'}`);
    return passed ? true : false;
}
