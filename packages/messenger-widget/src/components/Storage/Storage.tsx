/* eslint-disable no-console */
import { syncAcknoledgment } from '@dm3-org/dm3-lib-delivery-api';
import { getBrowserStorageKey } from '@dm3-org/dm3-lib-profile';
import { log } from '@dm3-org/dm3-lib-shared';
import {
    SyncProcessState,
    sync as syncStorage,
    useDm3Storage,
} from '@dm3-org/dm3-lib-storage';
import localforage from 'localforage';
import { useContext, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { GlobalContext } from '../../utils/context-utils';
import { UserDbType } from '../../utils/enum-type-utils';
import { useMainnetProvider } from '../../hooks/mainnetprovider/useMainnetProvider';

export default function Storage() {
    const { state, dispatch } = useContext(GlobalContext);
    const mainnetProvider = useMainnetProvider();

    const { account, deliveryServiceToken } = useContext(AuthContext);

    const sync = async () => {
        if (!deliveryServiceToken || !account) {
            log('[sync] not logged in yet', 'error');
            return;
        }

        dispatch({
            type: UserDbType.setSyncProcessState,
            payload: SyncProcessState.Running,
        });

        try {
            let acknowledgements = [];
            if (state.userDb) {
                await useDm3Storage(
                    mainnetProvider!,
                    account,
                    state.userDb,
                    deliveryServiceToken,
                );
            }

            const syncResult = await syncStorage(
                state.userDb,
                deliveryServiceToken,
            );

            acknowledgements = syncResult.acknoledgments;

            if (state.userDb && acknowledgements.length > 0) {
                await syncAcknoledgment(
                    mainnetProvider!,
                    account,
                    acknowledgements,
                    deliveryServiceToken,
                    state.uiState.lastMessagePull,
                );
            }

            dispatch({ type: UserDbType.setSynced, payload: true });
            dispatch({
                type: UserDbType.setSyncProcessState,
                payload: SyncProcessState.Idle,
            });
        } catch (e) {
            log('[sync] ' + JSON.stringify(e), 'error');
            dispatch({
                type: UserDbType.setSyncProcessState,
                payload: SyncProcessState.Failed,
            });
        }
    };

    const autoSync = () => {
        if (state.userDb && !state.userDb.synced) {
            log(
                `[DB] Create user storage external snapshot at timestamp ${state.userDb?.lastChangeTimestamp}`,
                'info',
            );
            sync();
        }
    };

    useEffect(() => {
        // eslint-disable-next-line no-console
        console.log('trigger storage sync');
        if (state.userDb?.syncProcessState === SyncProcessState.Failed) {
            // eslint-disable-next-line no-console
            console.log('sync falied');
        }
        const setBroserStorage = async () => {
            localforage.setItem(
                getBrowserStorageKey(account!.ensName),
                (await syncStorage(state.userDb, deliveryServiceToken!))
                    .userStorage,
            );
        };
        if (state.uiState.browserStorageBackup) {
            log(
                `[DB/Browser] Create user storage browser snapshot at timestamp ${state.userDb?.lastChangeTimestamp}`,
                'info',
            );
            setBroserStorage();
        }
        autoSync();
    }, [state.userDb?.lastChangeTimestamp, deliveryServiceToken, account]);

    return <></>;
}
