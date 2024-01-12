import { ethers } from 'ethers';
import { Socket } from 'socket.io-client';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import { StorageLocation } from '@dm3-org/dm3-lib-storage';
import { Account } from '@dm3-org/dm3-lib-profile';
import { ConnectionState } from '../utils/enum-type-utils';

declare global {
    interface Window {
        ethereum?: any;
    }
}

export interface Connection {
    socket?: Socket<DefaultEventsMap, DefaultEventsMap>;
    defaultServiceUrl: string;
}

export interface SignInProps {
    hideStorageSelection: boolean;
    miniSignIn: boolean;
    defaultStorageLocation: StorageLocation | undefined;
}
