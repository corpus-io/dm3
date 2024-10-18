import { Conversations } from './conversation/Conversations';
import { Tld } from './tld/Tld';

export class Dm3 {
    public readonly conversations: Conversations;
    public readonly tld: Tld;

    constructor(conversations: Conversations, tld: Tld) {
        this.conversations = conversations;
        this.tld = tld;
    }
}
