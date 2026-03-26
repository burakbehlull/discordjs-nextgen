import type { Message } from '../structures/Message.js';
import { Cooldown } from '../utils/Cooldown.js';
import { Permission, type PermissionName } from '../utils/Permission.js';
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

export class PrefixHandler {
  private prefixes: string[];
  private readonly commands: Map<string, PrefixCommand> = new Map();
  private readonly cooldowns: Map<string, Cooldown> = new Map();
  private ignoreBots: boolean;
  private caseSensitive: boolean;

  constructor(options: Partial<PrefixOptions> = {}) {
    this.prefixes = Array.isArray(options.prefix) ? options.prefix : options.prefix ? [options.prefix] : ['!'];
    this.ignoreBots = options.ignoreBots ?? true;
    this.caseSensitive = options.caseSensitive ?? false;

    if (options.commands) {
      for (const cmd of options.commands) {
        this.addCommand(cmd);
      }
    }
  }

  configure(options: Partial<PrefixOptions> = {}): void {
    if (options.prefix !== undefined) {
      this.prefixes = Array.isArray(options.prefix) ? options.prefix : [options.prefix];
    }

    if (options.ignoreBots !== undefined) {
      this.ignoreBots = options.ignoreBots;
    }

    if (options.caseSensitive !== undefined) {
      this.caseSensitive = options.caseSensitive;
    }

    if (options.commands) {
      for (const cmd of options.commands) {
        this.addCommand(cmd);
      }
    }
  }

  addCommand(cmd: PrefixCommand): void {
    const name = this.caseSensitive ? cmd.name : cmd.name.toLowerCase();
    this.commands.set(name, cmd);
    for (const alias of cmd.aliases ?? []) {
      const aliasName = this.caseSensitive ? alias : alias.toLowerCase();
      this.commands.set(aliasName, cmd);
    }
    if (cmd.cooldown) {
      this.cooldowns.set(name, new Cooldown(cmd.cooldown));
    }
  }

  getPrefix(content: string): string | null {
    for (const prefix of this.prefixes) {
      if (content.startsWith(prefix)) {
        return prefix;
      }
    }
    return null;
  }

  async handle(message: Message): Promise<void> {
    if (this.ignoreBots && message.author.bot) return;

    const usedPrefix = (message as any)._usedPrefix || this.getPrefix(message.content);
    if (!usedPrefix) return;

    const [commandName, ...args] = message.content.slice(usedPrefix.length).trim().split(/\s+/);
    if (!commandName) return;

    const lookupName = this.caseSensitive ? commandName : commandName.toLowerCase();
    const cmd = this.commands.get(lookupName);
    if (!cmd) return;

    if (cmd.permissions && cmd.permissions.length > 0) {
      const memberPermissions = (message as unknown as { memberPermissions?: string }).memberPermissions;
      if (!memberPermissions || !Permission.hasAll(memberPermissions, cmd.permissions)) {
        await message.reply(`Bu komutu kullanmak için yetkin yok: \`${cmd.permissions.join(', ')}\``);
        return;
      }
    }

    const cooldown = this.cooldowns.get(cmd.name.toLowerCase());
    if (cooldown?.isOnCooldown(message.author.id)) {
      const kalan = cooldown.remaining(message.author.id);
      await message.reply(`Lütfen **${kalan}** saniye bekle.`);
      return;
    }

    cooldown?.set(message.author.id);

    const ctx = new Context(message, args);
    try {
      await cmd.run(ctx, args);
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      await ctx.reply(`Komut çalıştırılırken hata oluştu: \`${error}\``).catch(() => null);
    }
  }
}
