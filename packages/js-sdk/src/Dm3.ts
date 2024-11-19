import { Conversations } from './conversation/Conversations';
import { ITLDResolver } from './tld/nameService/ITLDResolver';

export class Dm3 {
    public readonly conversations: Conversations;
    public readonly tld: ITLDResolver;

    constructor(conversations: Conversations, tld: ITLDResolver) {
        this.conversations = conversations;
        this.tld = tld;
    }
}
