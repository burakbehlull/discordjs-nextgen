import { Cooldown } from '../utils/Cooldown.js';
import { Permission } from '../utils/Permission.js';
import { Context } from '../structures/Context.js';
export class PrefixHandler {
    constructor(options = {}) {
        this.commands = new Map();
        this.cooldowns = new Map();
        this.prefixes = Array.isArray(options.prefix) ? options.prefix : options.prefix ? [options.prefix] : ['!'];
        this.ignoreBots = options.ignoreBots ?? true;
        if (options.commands) {
            for (const cmd of options.commands) {
                this.addCommand(cmd);
            }
        }
    }
    configure(options = {}) {
        if (options.prefix !== undefined) {
            this.prefixes = Array.isArray(options.prefix) ? options.prefix : [options.prefix];
        }
        if (options.ignoreBots !== undefined) {
            this.ignoreBots = options.ignoreBots;
        }
        if (options.commands) {
            for (const cmd of options.commands) {
                this.addCommand(cmd);
            }
        }
    }
    addCommand(cmd) {
        this.commands.set(cmd.name.toLowerCase(), cmd);
        for (const alias of cmd.aliases ?? []) {
            this.commands.set(alias.toLowerCase(), cmd);
        }
        if (cmd.cooldown) {
            this.cooldowns.set(cmd.name.toLowerCase(), new Cooldown(cmd.cooldown));
        }
    }
    async handle(message) {
        if (this.ignoreBots && message.author.bot)
            return;
        const content = message.content;
        let usedPrefix = null;
        for (const prefix of this.prefixes) {
            if (content.startsWith(prefix)) {
                usedPrefix = prefix;
                break;
            }
        }
        if (!usedPrefix)
            return;
        const [commandName, ...args] = content.slice(usedPrefix.length).trim().split(/\s+/);
        if (!commandName)
            return;
        const cmd = this.commands.get(commandName.toLowerCase());
        if (!cmd)
            return;
        if (cmd.permissions && cmd.permissions.length > 0) {
            const memberPermissions = message.memberPermissions;
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
        }
        catch (err) {
            const error = err instanceof Error ? err.message : String(err);
            await ctx.reply(`Komut çalıştırılırken hata oluştu: \`${error}\``).catch(() => null);
        }
    }
}
//# sourceMappingURL=PrefixHandler.js.map