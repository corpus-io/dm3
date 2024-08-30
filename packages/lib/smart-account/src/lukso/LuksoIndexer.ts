import { ApolloClient, InMemoryCache, gql } from '@apollo/client';
import { getAddress } from 'ethers/lib/utils';

export class LuksoIndexer {
    private client: ApolloClient<any>;

    constructor() {
        //official lukso indexer url
        const indexerUrl = 'https://envio.mainnet.lukso.dev/v1/graphql';
        const cache = new InMemoryCache();

        //Create new ApolloClient instance
        const client = new ApolloClient({
            // Provide required constructor fields
            cache: cache,
            uri: indexerUrl,
        });

        this.client = client;
    }

    public async resolveAddress(address: string): Promise<string | undefined> {
        const query = gql`
            query MyQuery {
                Profile(where: { id: { _ilike: "${address}" } }) {
                    fullName
                }
            }
        `;

        const result = await this.client.query({ query });
        //Get the profile from the result
        const [profile] = result.data.Profile;

        //Return the name of the profile, or undefined if no profile was found
        return profile?.name;
    }
    public async resolveName(
        lsp3FullName: string,
    ): Promise<string | undefined> {
        const query = gql`
            query MyQuery {
                search_profiles(args: { search: "${lsp3FullName}" }) {
                    id
                }
            }
        `;

        const result = await this.client.query({ query });

        const [search_profiles] = result.data;

        //Returns undefined if the profile was not found
        if (!search_profiles) {
            return undefined;
        }
        //returns the normalized ENS name
        return getAddress(search_profiles.id);
    }
}
