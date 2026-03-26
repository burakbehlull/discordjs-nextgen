import { Context } from '../structures/Context.js';
export class CommandHandler {
    constructor(options = {}) {
        this.commands = new Map();
        this.guildId = options.guildId;
        if (options.commands) {
            for (const cmd of options.commands) {
                this.addCommand(cmd);
            }
        }
    }
    configure(options = {}) {
        if (options.guildId !== undefined) {
            this.guildId = options.guildId;
        }
        if (options.commands) {
            for (const cmd of options.commands) {
                this.addCommand(cmd);
            }
        }
    }
    addCommand(cmd) {
        const name = cmd.data.toJSON().name;
        this.commands.set(name, cmd);
    }
    async handle(interaction) {
        if (!interaction.isCommand)
            return;
        if (!interaction.commandName)
            return;
        const cmd = this.commands.get(interaction.commandName);
        if (!cmd)
            return;
        const ctx = new Context(interaction);
        try {
            await cmd.run(ctx);
        }
        catch (err) {
            const error = err instanceof Error ? err.message : String(err);
            const msg = `Komut çalıştırılırken hata oluştu: \`${error}\``;
            await ctx.reply({ content: msg, ephemeral: true }).catch(() => null);
        }
    }
    getBuilders() {
        return [...this.commands.values()].map((c) => c.data);
    }
}
//# sourceMappingURL=CommandHandler.js.map