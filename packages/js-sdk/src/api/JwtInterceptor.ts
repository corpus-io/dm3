import axios, {
    Axios,
    AxiosError,
    AxiosRequestConfig,
    AxiosResponse,
} from 'axios';

import socketIOClient, { Socket } from 'socket.io-client';

//Make request to Server
//If 401 then re-authenticate
//and try again
export abstract class JwtInterceptor {
    private readonly baseURL: string;
    private readonly enableWebsocket: boolean;

    private axios: Axios;
    private socket: Socket;

    protected readonly ensName: string;

    constructor(baseURL: string, ensName: string, enableWebsocket: boolean) {
        this.baseURL = baseURL;
        this.ensName = ensName;
        this.enableWebsocket = enableWebsocket;
        this.initializeAxios();
    }

    //TBD child can use this method to call a method from the DS
    public getAuthenticatedAxiosClient() {
        return this.axios;
    }
    public getAuthenticatedWebSocketClient() {
        return this.socket;
    }

    protected setAuthToken(token: string) {
        this.axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        this.initializeSocketIO(token);
    }

    protected async onSucces(res: AxiosResponse) {
        return res;
    }
    protected async onError(err: AxiosError) {
        if (err.response?.status === 401) {
            // re-authenticate
            const newToken = await this.onReAuth();
            const prevReq: AxiosRequestConfig = err.config;
            const newReq = {
                ...prevReq,
                headers: {
                    ...prevReq.headers,
                    Authorization: `Bearer ${newToken}`,
                },
            };
            this.setAuthToken(newToken);
            return await this.axios.request(newReq);
            //retry the request
        }
        //If the error is not 401, throw the error
        throw err;
    }

    protected abstract onReAuth(): Promise<string>;

    protected initializeAxios() {
        const onError = this.onError.bind(this);
        const _axios = axios.create({ baseURL: this.baseURL });
        _axios.interceptors.response.use(this.onSucces, onError);
        this.axios = _axios;
    }
    protected initializeSocketIO(token: string) {
        if (!this.enableWebsocket) {
            //Websocket is disabled
            return;
        }
        //webserver routes root path to socket.io
        const url = this.baseURL.replace('/ds', '');

        const socket = socketIOClient(url, {
            autoConnect: true,
            transports: ['websocket'],
        });

        socket.auth = {
            account: {
                ensName: this.ensName,
            },
            token: token,
        };

        socket.connect();
        this.socket = socket;
    }
}
