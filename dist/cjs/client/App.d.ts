import { EventEmitter } from 'events';
import { RESTClient } from '../rest/RESTClient.js';
import { Message } from '../structures/Message.js';
import { User } from '../structures/User.js';
import { Guild } from '../structures/Guild.js';
import { Channel } from '../structures/Channel.js';
import { Interaction } from '../structures/Interaction.js';
import { type PrefixOptions } from '../handlers/PrefixHandler.js';
import { type CommandHandlerOptions } from '../handlers/CommandHandler.js';
import { type ButtonHandler, type ButtonHandlerOptions } from '../handlers/ButtonHandler.js';
import { Modal } from '../builders/ModalBuilder.js';
import { SlashCommandBuilder, type SlashCommandOption } from '../builders/SlashCommandBuilder.js';
import { type MiddlewareFunction } from '../utils/MiddlewareManager.js';
import { Context } from '../structures/Context.js';
import { type PermissionName } from '../utils/Permission.js';
import type { PresenceData } from '../types/raw.js';
import { Intents } from '../types/constants.js';
export interface HybridCommand {
    name: string;
    description: string;
    aliases?: string[];
    cooldown?: number;
    permissions?: PermissionName[];
    options?: SlashCommandOption[];
    run: (ctx: Context, args: string[]) => Promise<void> | void;
}
export interface AppOptions {
    intents?: number | (keyof typeof Intents)[];
    presence?: Partial<PresenceData>;
}
export interface AppEvents {
    ready: [user: User];
    messageCreate: [message: Message];
    messageUpdate: [message: Message];
    messageDelete: [data: {
        id: string;
        channelId: string;
        guildId?: string;
    }];
    interactionCreate: [interaction: Interaction];
    guildCreate: [guild: Guild];
    guildDelete: [data: {
        id: string;
    }];
    error: [error: Error];
}
export interface AppEvent<K extends keyof AppEvents = keyof AppEvents> {
    name: K;
    once?: boolean;
    run: (...args: AppEvents[K]) => Promise<void> | void;
}
export interface AppPlugin {
    name: string;
    setup: (app: App) => void;
}
export interface App {
    on<K extends keyof AppEvents>(event: K, listener: (...args: AppEvents[K]) => void): this;
    once<K extends keyof AppEvents>(event: K, listener: (...args: AppEvents[K]) => void): this;
    off<K extends keyof AppEvents>(event: K, listener: (...args: AppEvents[K]) => void): this;
    emit<K extends keyof AppEvents>(event: K, ...args: AppEvents[K]): boolean;
}
export interface HybridOptions extends Partial<Omit<HybridCommand, 'run' | 'name' | 'description'>> {
    folder?: string;
}
export declare class App extends EventEmitter {
    private options;
    readonly rest: RESTClient;
    readonly guilds: Map<string, Guild>;
    readonly users: Map<string, User>;
    readonly channels: Map<string, Channel>;
    private gateway;
    private token;
    private prefixHandler;
    private commandHandler;
    private buttonHandler;
    private modalHandler;
    private middlewareManager;
    private prefixBound;
    private interactionBound;
    private readyBound;
    user: User | null;
    constructor(options?: AppOptions);
    private resolveIntents;
    prefix(options: string | (PrefixOptions & {
        folder?: string;
    })): this;
    slash(options: string | (CommandHandlerOptions & {
        folder?: string;
    })): this;
    button(options: string | ButtonHandler | (ButtonHandlerOptions & {
        folder?: string;
    }), callback?: (ctx: Context) => Promise<void> | void): this;
    buttons(options: string | ButtonHandler | (ButtonHandlerOptions & {
        folder?: string;
    }), callback?: (ctx: Context) => Promise<void> | void): this;
    modal(options: Modal | {
        folder: string;
    }): this;
    get modals(): Map<string, Modal>;
    use(fn: MiddlewareFunction | AppPlugin): this;
    command(options: string | (HybridOptions & {
        folder: string;
    }) | HybridCommand): this;
    commands(options: CommandHandlerOptions): this;
    events(folderPath: string): this;
    run(token: string): this;
    login(token: string): this;
    private registerHybrid;
    private handleDispatch;
    fetchUser(userId: string): Promise<User>;
    fetchChannel(channelId: string): Promise<Channel>;
    fetchGuild(guildId: string): Promise<Guild>;
    registerCommands(commands: SlashCommandBuilder[], guildId?: string): Promise<void>;
    setPresence(presence: Partial<PresenceData>): void;
    private normalizePresence;
    destroy(): void;
    private bindPrefixListener;
    private bindInteractionListener;
    private bindReadyListener;
    private syncApplicationCommands;
}
//# sourceMappingURL=App.d.ts.map