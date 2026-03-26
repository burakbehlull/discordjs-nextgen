import type { Message } from '../structures/Message.js';
import { type PermissionName } from '../utils/Permission.js';
import { Context } from '../structures/Context.js';
export interface PrefixCommand {
    name: string;
    description?: string;
    aliases?: string[];
    cooldown?: number;
    permissions?: PermissionName[];
    run: (ctx: Context, args: string[]) => Promise<void> | void;
}
export interface PrefixOptions {
    prefix?: string | string[];
    commands?: PrefixCommand[];
    ignoreBots?: boolean;
    caseSensitive?: boolean;
}
export declare class PrefixHandler {
    private prefixes;
    private readonly commands;
    private readonly cooldowns;
    private ignoreBots;
    private caseSensitive;
    constructor(options?: Partial<PrefixOptions>);
    configure(options?: Partial<PrefixOptions>): void;
    addCommand(cmd: PrefixCommand): void;
    handle(message: Message): Promise<void>;
}
//# sourceMappingURL=PrefixHandler.d.ts.map