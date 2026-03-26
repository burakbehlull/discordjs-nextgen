import type { RESTClient } from '../rest/RESTClient.js';
import type { RawGuild } from '../types/raw.js';
import { Channel } from './Channel.js';
import { User } from './User.js';
export declare class Guild {
    readonly id: string;
    readonly name: string;
    readonly icon: string | null;
    readonly ownerId: string;
    readonly memberCount: number;
    readonly channels: Map<string, Channel>;
    private rest;
    constructor(data: RawGuild, rest: RESTClient);
    iconURL(options?: {
        size?: 16 | 32 | 64 | 128 | 256 | 512 | 1024;
        format?: 'png' | 'jpg' | 'webp' | 'gif';
    }): string | null;
    fetchOwner(): Promise<User>;
    fetchMember(userId: string): Promise<{
        user: User;
        nick: string | null;
        roles: string[];
    }>;
    ban(userId: string, options?: {
        deleteMessageDays?: number;
        reason?: string;
    }): Promise<void>;
    unban(userId: string, reason?: string): Promise<void>;
    kick(userId: string, reason?: string): Promise<void>;
    setNickname(userId: string, nick: string | null, reason?: string): Promise<void>;
    createChannel(options: {
        name: string;
        type?: number;
        topic?: string;
        parentId?: string;
        reason?: string;
    }): Promise<Channel>;
    toString(): string;
}
//# sourceMappingURL=Guild.d.ts.map