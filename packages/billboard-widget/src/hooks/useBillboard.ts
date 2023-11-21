import { getBillboardApiClient } from 'dm3-lib-billboard-client-api';
import { useContext, useEffect, useState } from 'react';

import { Message } from 'dm3-lib-messaging';
import { Socket, io } from 'socket.io-client';
import { GlobalContext } from '../context/GlobalContext';
import useMessages from './useMessages';

const useBillboard = () => {
    const {
        clientProps: { mockedApi, billboardId, billboardClientUrl },
    } = useContext(GlobalContext);
    const { messages, setMessages, addMessage, sendDm3Message } = useMessages();
    const [loading, setLoading] = useState<boolean>(false);
    const [online, setOnline] = useState<boolean>(false);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [viewersCount, setViewersCount] = useState<number>(0);

    useEffect(() => {
        const client = getBillboardApiClient({
            //mock: !!mockedApi,
            mock: false,
            baseURL: billboardClientUrl,
        });

        const getInitialMessages = async () => {
            //Initial message are already fetched
            if (messages.length > 0 || loading) {
                return;
            }

            setMessages([]);
            setLoading(true);
            const initialMessages = await client.getMessages(
                billboardId,
                Date.now(),
                '0',
            );

            if (initialMessages) {
                setMessages(initialMessages);
            }
            const viewers = await client.getActiveViewers(billboardId || '');
            setViewersCount(viewers || 0);
            setLoading(false);
        };
        getInitialMessages();
    }, [
        billboardClientUrl,
        billboardId,
        mockedApi,
        messages,
        setMessages,
        loading,
    ]);

    useEffect(() => {
        if (socket || mockedApi) {
            return;
        }
        setSocket(io(billboardClientUrl));
    }, [billboardClientUrl, socket, mockedApi]);

    useEffect(() => {
        if (!socket) {
            return;
        }

        socket.on('connect', function () {
            setOnline(true);
        });

        socket.on('disconnect', function () {
            setOnline(false);
        });

        socket.on(`message-${billboardId}`, function (data: Message) {
            addMessage(data);
        });
    }, [addMessage, socket, billboardId]);

    return {
        online,
        loading,
        messages,
        viewersCount,
        sendDm3Message,
    };
};

export default useBillboard;
