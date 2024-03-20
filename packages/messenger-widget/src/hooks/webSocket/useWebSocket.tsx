import { EncryptionEnvelop } from '@dm3-org/dm3-lib-messaging';
import { getDeliveryServiceProfile } from '@dm3-org/dm3-lib-profile';
import axios from 'axios';
import { useCallback, useContext, useEffect, useState } from 'react';
import socketIOClient, { Socket } from 'socket.io-client';
import { AuthContext } from '../../context/AuthContext';
import { useMainnetProvider } from '../mainnetprovider/useMainnetProvider';

export const useWebSocket = () => {
    const { isLoggedIn, account, deliveryServiceToken } =
        useContext(AuthContext);
    const mainnetProvider = useMainnetProvider();

    const [deliveryServiceUrl, setdeliveryServiceUrl] = useState('');
    const [socket, setSocket] = useState<Socket>();

    useEffect(() => {
        const getDeliveryServiceUrl = async () => {
            if (deliveryServiceUrl !== '') {
                return;
            }
            if (account === undefined) {
                return;
            }
            const deliveryServiceProfile = await getDeliveryServiceProfile(
                account.profile!.deliveryServices[0],
                mainnetProvider!,
                async (url: string) => (await axios.get(url)).data,
            );

            setdeliveryServiceUrl(deliveryServiceProfile!.url);
        };
        getDeliveryServiceUrl();
    }, [account?.profile]);

    useEffect(() => {
        if (isLoggedIn && deliveryServiceUrl) {
            if (!account?.profile) {
                throw Error('Could not get account profile');
            }

            const socket = socketIOClient(
                deliveryServiceUrl.replace('/api', ''),
                {
                    autoConnect: false,
                    transports: ['websocket'],
                },
            );

            socket.auth = {
                account: account,
                token: deliveryServiceToken!,
            };
            socket.connect();
            setSocket(socket);
        }
    }, [isLoggedIn, deliveryServiceUrl]);

    const onNewMessage = useCallback(
        (cb: OnNewMessagCallback) => {
            if (!socket) {
                return;
            }
            socket.on('message', (envelop: EncryptionEnvelop) => {
                cb(envelop);
            });
        },
        [socket],
    );

    const removeOnNewMessageListener = useCallback(() => {
        socket?.removeListener('message');
    }, [socket]);

    return { onNewMessage, socket, removeOnNewMessageListener };
};

export type OnNewMessagCallback = (envelop: EncryptionEnvelop) => void;
