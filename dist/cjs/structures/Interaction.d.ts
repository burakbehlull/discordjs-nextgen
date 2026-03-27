import type { RESTClient } from '../rest/RESTClient.js';
import type { RawInteraction } from '../types/raw.js';
import { User } from './User.js';
import { Channel } from './Channel.js';
import type { EmbedBuilder } from '../builders/EmbedBuilder.js';
import type { ActionRowBuilder } from '../builders/ButtonBuilder.js';
import type { Modal } from '../builders/ModalBuilder.js';
import type { Member } from './Message.js';
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
    readonly createdAt: Date;
    readonly memberPermissions: string | null;
    values: Record<string, string>;
    _usedPrefix: string | null;
    readonly member: Member | null;
    private options;
    private rest;
    private _replied;
    private _deferred;
    constructor(data: RawInteraction, rest: RESTClient);
    get isCommand(): boolean;
    get isButton(): boolean;
    get isModalSubmit(): boolean;
    get replied(): boolean;
    get deferred(): boolean;
    get channel(): Channel | null;
    getString(name: string): string | null;
    getInteger(name: string): number | null;
    getBoolean(name: string): boolean | null;
    get optionValues(): (string | number | boolean)[];
    reply(options: string | InteractionReplyOptions): Promise<void>;
    deferReply(ephemeral?: boolean): Promise<void>;
    showModal(modal: Modal | Record<string, any>): Promise<void>;
    followUp(options: string | InteractionReplyOptions): Promise<void>;
    editReply(options: string | InteractionReplyOptions): Promise<void>;
    private resolveOptions;
    private parseMember;
}
//# sourceMappingURL=Interaction.d.ts.map