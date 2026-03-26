import { EventEmitter } from 'events';
import { RESTClient } from '../rest/RESTClient';
import { Message } from '../structures/Message';
import { User } from '../structures/User';
import { Guild } from '../structures/Guild';
import { Channel } from '../structures/Channel';
import { Interaction } from '../structures/Interaction';
import { SlashCommandBuilder } from '../builders/SlashCommandBuilder';
import { type PrefixOptions } from '../handlers/PrefixHandler';
import { type CommandHandlerOptions } from '../handlers/CommandHandler';
import type { PresenceData } from '../types/raw';
import { Intents } from '../types/constants';
export interface AppOptions {
    intents?: number | (keyof typeof Intents)[];
    presence?: PresenceData;
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
export interface App {
    on<K extends keyof AppEvents>(event: K, listener: (...args: AppEvents[K]) => void): this;
    once<K extends keyof AppEvents>(event: K, listener: (...args: AppEvents[K]) => void): this;
    off<K extends keyof AppEvents>(event: K, listener: (...args: AppEvents[K]) => void): this;
    emit<K extends keyof AppEvents>(event: K, ...args: AppEvents[K]): boolean;
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
    user: User | null;
    constructor(options?: AppOptions);
    private resolveIntents;
    prefix(options: string | (PrefixOptions & {
        folder?: string;
    })): this;
    slash(options: string | (CommandHandlerOptions & {
        folder?: string;
    })): this;
    commands(options: CommandHandlerOptions): this;
    events(folderPath: string): this;
    login(token: string): this;
    private handleDispatch;
    fetchUser(userId: string): Promise<User>;
    fetchChannel(channelId: string): Promise<Channel>;
    fetchGuild(guildId: string): Promise<Guild>;
    registerCommands(commands: SlashCommandBuilder[], guildId?: string): Promise<void>;
    setPresence(presence: PresenceData): void;
    destroy(): void;
}
//# sourceMappingURL=App.d.ts.map