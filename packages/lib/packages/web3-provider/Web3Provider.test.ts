import { ConnectionState, getWeb3Provider } from './Web3Provider';

test('handels no web3 provider correctly', async () => {
    expect(await getWeb3Provider(null)).toStrictEqual({
        connectionState: ConnectionState.ConnectionRejected,
    });
});

test('handels web3 provider correctly', async () => {
    expect(
        (await getWeb3Provider(async () => null)).connectionState,
    ).toStrictEqual(ConnectionState.AccountConntectReady);
});
