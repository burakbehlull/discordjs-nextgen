import type { Message } from '../structures/Message';
import { type PermissionName } from '../utils/Permission';
import { Context } from '../structures/Context';
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
}
export declare class PrefixHandler {
    private readonly prefixes;
    private readonly commands;
    private readonly cooldowns;
    private readonly ignoreBots;
    constructor(options?: Partial<PrefixOptions>);
    addCommand(cmd: PrefixCommand): void;
    handle(message: Message): Promise<void>;
}
//# sourceMappingURL=PrefixHandler.d.ts.map