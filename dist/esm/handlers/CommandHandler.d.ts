import type { Interaction } from '../structures/Interaction';
import type { SlashCommandBuilder } from '../builders/SlashCommandBuilder';
export interface SlashCommand {
    data: SlashCommandBuilder;
    run: (interaction: Interaction) => Promise<void> | void;
}
export interface CommandHandlerOptions {
    commands?: SlashCommand[];
    guildId?: string;
}
export declare class CommandHandler {
    readonly commands: Map<string, SlashCommand>;
    readonly guildId: string | undefined;
    constructor(options?: Partial<CommandHandlerOptions>);
    addCommand(cmd: SlashCommand): void;
    handle(interaction: Interaction): Promise<void>;
    getBuilders(): SlashCommandBuilder[];
}
//# sourceMappingURL=CommandHandler.d.ts.map