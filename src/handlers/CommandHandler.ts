import type { Interaction } from '../structures/Interaction.js';
import type { SlashCommandBuilder } from '../builders/SlashCommandBuilder.js';
import { Context } from '../structures/Context.js';

export interface SlashCommand {
  data: SlashCommandBuilder;
  aliases?: string[];
  usage?: string;
  category?: string;
  run: (ctx: Context) => Promise<void> | void;
}

export interface CommandHandlerOptions {
  commands?: SlashCommand[];
  guildId?: string;
}

export class CommandHandler {
  readonly commands: Map<string, SlashCommand> = new Map();
  guildId: string | undefined;

  constructor(options: Partial<CommandHandlerOptions> = {}) {
    this.guildId = options.guildId;
    if (options.commands) {
      for (const cmd of options.commands) {
        this.addCommand(cmd);
      }
    }
  }

  configure(options: Partial<CommandHandlerOptions> = {}): void {
    if (options.guildId !== undefined) {
      this.guildId = options.guildId;
    }

    if (options.commands) {
      for (const cmd of options.commands) {
        this.addCommand(cmd);
      }
    }
  }

  addCommand(cmd: SlashCommand): void {
    const name = (cmd.data.toJSON() as { name: string }).name;
    this.commands.set(name, cmd);

    for (const alias of cmd.aliases ?? []) {
      this.commands.set(alias, cmd);
    }
  }

  async handle(interaction: Interaction, ctx: Context): Promise<void> {
    if (!interaction.isCommand) return;
    if (!interaction.commandName) return;

    const cmd = this.commands.get(interaction.commandName);
    if (!cmd) return;

    try {
      await cmd.run(ctx);
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      const msg = `Komut çalıştırılırken hata oluştu: \`${error}\``;
      await ctx.reply({ content: msg, ephemeral: true }).catch(() => null);
    }
  }

  getBuilders(): SlashCommandBuilder[] {
    const builders: SlashCommandBuilder[] = [];
    const addedNames = new Set<string>();

    for (const [name, cmd] of this.commands.entries()) {
      if (addedNames.has(name)) continue;

      builders.push(cmd.data.copy().setName(name));
      addedNames.add(name);
    }

    return builders;
  }
}
