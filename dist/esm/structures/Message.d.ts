import type { RESTClient } from '../rest/RESTClient';
import type { RawMessage } from '../types/raw';
import { User } from './User';
import { Channel } from './Channel';
import type { EmbedBuilder } from '../builders/EmbedBuilder';
import type { ActionRowBuilder } from '../builders/ButtonBuilder';
export interface Member {
    nick: string | null;
    roles: string[];
    joinedAt: Date;
    permissions: string | null;
}
export interface MessageReplyOptions {
    content?: string;
    embeds?: EmbedBuilder[];
    components?: ActionRowBuilder[];
}
export declare class Message {
    readonly id: string;
    readonly channelId: string;
    readonly guildId: string | null;
    readonly author: User;
    readonly content: string;
    readonly createdAt: Date;
    readonly editedAt: Date | null;
    readonly pinned: boolean;
    readonly type: number;
    readonly member: Member | null;
    private rest;
    constructor(data: RawMessage, rest: RESTClient);
    private static parseMember;
    get memberPermissions(): string | null;
    get channel(): Channel;
    reply(options: string | MessageReplyOptions): Promise<Message>;
    edit(options: string | MessageReplyOptions): Promise<Message>;
    delete(reason?: string): Promise<void>;
    pin(reason?: string): Promise<void>;
    unpin(reason?: string): Promise<void>;
    react(emoji: string): Promise<void>;
    toString(): string;
}
//# sourceMappingURL=Message.d.ts.map