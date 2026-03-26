export type SlashCommandOptionType = 'string' | 'integer' | 'boolean' | 'user' | 'channel' | 'role' | 'mentionable' | 'number' | 'attachment';
export interface SlashCommandOption {
    name: string;
    description: string;
    type: SlashCommandOptionType;
    required?: boolean;
    choices?: Array<{
        name: string;
        value: string | number;
    }>;
}
export declare class SlashCommandBuilder {
    private data;
    setName(name: string): this;
    setDescription(description: string): this;
    addOption(option: SlashCommandOption): this;
    toJSON(): Record<string, unknown>;
}
//# sourceMappingURL=SlashCommandBuilder.d.ts.map