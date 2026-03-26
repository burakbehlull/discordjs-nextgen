import type { Interaction } from '../structures/Interaction';
import type { SlashCommandBuilder } from '../builders/SlashCommandBuilder';
import { Context } from '../structures/Context';

export interface SlashCommand {
  data: SlashCommandBuilder;
  run: (ctx: Context) => Promise<void> | void;
}

export interface CommandHandlerOptions {
  commands?: SlashCommand[];
  guildId?: string;
}

export class CommandHandler {
  readonly commands: Map<string, SlashCommand> = new Map();
  readonly guildId: string | undefined;

  constructor(options: Partial<CommandHandlerOptions> = {}) {
    this.guildId = options.guildId;
    if (options.commands) {
      for (const cmd of options.commands) {
        this.addCommand(cmd);
      }
    }
  }

  addCommand(cmd: SlashCommand): void {
    const name = (cmd.data.toJSON() as { name: string }).name;
    this.commands.set(name, cmd);
  }

  async handle(interaction: Interaction): Promise<void> {
    if (!interaction.isCommand) return;
    if (!interaction.commandName) return;

    const cmd = this.commands.get(interaction.commandName);
    if (!cmd) return;

    const ctx = new Context(interaction);
    try {
      await cmd.run(ctx);
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      const msg = `Komut çalıştırılırken hata oluştu: \`${error}\``;
      await ctx.reply({ content: msg, ephemeral: true }).catch(() => null);
    }
  }

  getBuilders(): SlashCommandBuilder[] {
    return [...this.commands.values()].map((c) => c.data);
  }
}
