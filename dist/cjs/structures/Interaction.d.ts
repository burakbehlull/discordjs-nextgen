import type { RESTClient } from '../rest/RESTClient';
import type { RawInteraction } from '../types/raw';
import { User } from './User';
import type { EmbedBuilder } from '../builders/EmbedBuilder';
import type { ActionRowBuilder } from '../builders/ButtonBuilder';
export interface InteractionReplyOptions {
    content?: string;
    embeds?: EmbedBuilder[];
    components?: ActionRowBuilder[];
    ephemeral?: boolean;
}
export declare class Interaction {
    readonly id: string;
    readonly applicationId: string;
    readonly type: number;
    readonly guildId: string | null;
    readonly channelId: string | null;
    readonly token: string;
    readonly commandName: string | null;
    readonly customId: string | null;
    readonly user: User;
    private options;
    private rest;
    private _replied;
    private _deferred;
    constructor(data: RawInteraction, rest: RESTClient);
    get isCommand(): boolean;
    get isButton(): boolean;
    get replied(): boolean;
    get deferred(): boolean;
    getString(name: string): string | null;
    getInteger(name: string): number | null;
    getBoolean(name: string): boolean | null;
    reply(options: string | InteractionReplyOptions): Promise<void>;
    deferReply(ephemeral?: boolean): Promise<void>;
    editReply(options: string | InteractionReplyOptions): Promise<void>;
    followUp(options: string | InteractionReplyOptions): Promise<void>;
    private resolveOptions;
}
//# sourceMappingURL=Interaction.d.ts.map