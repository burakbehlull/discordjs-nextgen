import type { RESTClient } from '../rest/RESTClient.js';
import { EmbedBuilder } from '../builders/EmbedBuilder.js';
import type { ActionRowBuilder } from '../builders/ButtonBuilder.js';
export interface MessageSendOptions {
    content?: string;
    embeds?: EmbedBuilder[];
    components?: ActionRowBuilder[];
}
export declare class Channel {
    readonly id: string;
    readonly type: number;
    readonly guildId: string | null;
    readonly name: string | null;
    readonly topic: string | null;
    readonly nsfw: boolean;
    readonly lastMessageId: string | null;
    readonly position: number | null;
    readonly parentId: string | null;
    private rest;
    constructor(data: {
        id: string;
        type: number;
        guild_id?: string;
        name?: string;
        topic?: string;
        nsfw?: boolean;
        last_message_id?: string;
        position?: number;
        parent_id?: string;
    }, rest: RESTClient);
    get isText(): boolean;
    get isVoice(): boolean;
    get isDM(): boolean;
    send(options: string | MessageSendOptions): Promise<unknown>;
    private resolveOptions;
    bulkDelete(count: number): Promise<void>;
    setTopic(topic: string, reason?: string): Promise<Channel>;
    toString(): string;
}
//# sourceMappingURL=Channel.d.ts.map