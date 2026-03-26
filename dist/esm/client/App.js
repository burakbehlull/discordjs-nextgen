import { EventEmitter } from 'events';
import { RESTClient } from '../rest/RESTClient.js';
import { Gateway } from '../gateway/Gateway.js';
import { Message } from '../structures/Message.js';
import { User } from '../structures/User.js';
import { Guild } from '../structures/Guild.js';
import { Channel } from '../structures/Channel.js';
import { Interaction } from '../structures/Interaction.js';
import { Logger } from '../utils/Logger.js';
import { PrefixHandler } from '../handlers/PrefixHandler.js';
import { CommandHandler } from '../handlers/CommandHandler.js';
import { ButtonHandlerManager } from '../handlers/ButtonHandler.js';
import { SlashCommandBuilder } from '../builders/SlashCommandBuilder.js';
import { FileLoader } from '../utils/FileLoader.js';
import { MiddlewareManager } from '../utils/MiddlewareManager.js';
import { Context } from '../structures/Context.js';
import { Intents } from '../types/constants.js';
export class App extends EventEmitter {
    constructor(options = {}) {
        super();
        this.options = options;
        this.guilds = new Map();
        this.users = new Map();
        this.channels = new Map();
        this.gateway = null;
        this.token = null;
        this.prefixHandler = null;
        this.commandHandler = null;
        this.buttonHandler = null;
        this.middlewareManager = new MiddlewareManager();
        this.prefixBound = false;
        this.interactionBound = false;
        this.readyBound = false;
        this.user = null;
        this.rest = new RESTClient('');
    }
    resolveIntents() {
        const { intents = Intents.ALL } = this.options;
        if (typeof intents === 'number')
            return intents;
        return intents.reduce((acc, key) => acc | Intents[key], 0);
    }
    prefix(options) {
        if (!this.prefixHandler) {
            this.prefixHandler = new PrefixHandler(typeof options === 'object' ? options : {});
        }
        else if (typeof options === 'object') {
            this.prefixHandler.configure(options);
        }
        if (typeof options === 'string' || (typeof options === 'object' && 'folder' in options)) {
            const folderPath = typeof options === 'string' ? options : options.folder;
            FileLoader.loadFiles(folderPath).then((cmds) => {
                for (const cmd of cmds) {
                    this.prefixHandler.addCommand(cmd);
                }
                Logger.success(`${cmds.length} prefix komutu [${folderPath}] klasorunden yuklendi.`);
            }).catch((err) => {
                Logger.error(`Prefix komutlari yuklenemedi: ${err.message}`);
            });
        }
        this.bindPrefixListener();
        return this;
    }
    slash(options) {
        if (!this.commandHandler) {
            this.commandHandler = new CommandHandler(typeof options === 'object' ? options : {});
        }
        else if (typeof options === 'object') {
            this.commandHandler.configure(options);
        }
        if (typeof options === 'string' || (typeof options === 'object' && 'folder' in options)) {
            const folderPath = typeof options === 'string' ? options : options.folder;
            const guildId = typeof options === 'object' ? options.guildId : undefined;
            FileLoader.loadFiles(folderPath).then((cmds) => {
                for (const cmd of cmds) {
                    this.commandHandler.addCommand(cmd);
                }
                Logger.success(`${cmds.length} slash komutu [${folderPath}] klasorunden yuklendi.`);
                void this.syncApplicationCommands(guildId);
            }).catch((err) => {
                Logger.error(`Slash komutlari yuklenemedi: ${err.message}`);
            });
        }
        this.bindReadyListener();
        this.bindInteractionListener();
        return this;
    }
    button(options) {
        if (!this.buttonHandler) {
            this.buttonHandler = new ButtonHandlerManager(typeof options === 'object' && !('run' in options) ? options : {});
        }
        if (typeof options === 'string' || (typeof options === 'object' && 'folder' in options)) {
            const folderPath = typeof options === 'string' ? options : options.folder;
            FileLoader.loadFiles(folderPath).then((buttons) => {
                for (const button of buttons) {
                    this.buttonHandler.addButton(button);
                }
                Logger.success(`${buttons.length} button handler [${folderPath}] klasorunden yuklendi.`);
            }).catch((err) => {
                Logger.error(`Button handlerlari yuklenemedi: ${err.message}`);
            });
        }
        else if ('run' in options) {
            this.buttonHandler.addButton(options);
        }
        else if ('buttons' in options && options.buttons) {
            this.buttonHandler.addButtons(options.buttons);
        }
        this.bindInteractionListener();
        return this;
    }
    buttons(options) {
        return this.button(options);
    }
    use(fn) {
        if (typeof fn === 'function') {
            this.middlewareManager.use(fn);
        }
        else if (typeof fn === 'object' && 'setup' in fn) {
            fn.setup(this);
        }
        return this;
    }
    command(options) {
        if (typeof options === 'string' || (typeof options === 'object' && 'folder' in options)) {
            const folderPath = typeof options === 'string' ? options : options.folder;
            FileLoader.loadFiles(folderPath).then((cmds) => {
                for (const cmd of cmds) {
                    this.registerHybrid(cmd);
                }
                Logger.success(`${cmds.length} hybrid komutu [${folderPath}] klasorunden yuklendi.`);
            }).catch((err) => {
                Logger.error(`Hybrid komutlari yuklenemedi: ${err.message}`);
            });
        }
        else {
            this.registerHybrid(options);
        }
        return this;
    }
    commands(options) {
        return this.slash(options);
    }
    events(folderPath) {
        FileLoader.loadFiles(folderPath).then((events) => {
            for (const event of events) {
                if (event.once) {
                    this.once(event.name, (...args) => event.run(...args));
                }
                else {
                    this.on(event.name, (...args) => event.run(...args));
                }
            }
            Logger.success(`${events.length} event [${folderPath}] klasorunden yuklendi.`);
        }).catch((err) => {
            Logger.error(`Eventler yuklenemedi: ${err.message}`);
        });
        return this;
    }
    run(token) {
        this.token = token.startsWith('Bot ') ? token.slice(4) : token;
        if (!this.token || this.token.trim() === '' || this.token === 'TOKEN_BURAYA') {
            throw new Error('[discordjs-nextgen] Gecerli bir bot tokeni girilmedi. app.run("TOKEN") ile tokeni ver.');
        }
        this.rest.setToken(this.token);
        this.gateway = new Gateway(this.token, {
            intents: this.resolveIntents(),
            presence: this.options.presence ? this.normalizePresence(this.options.presence) : undefined,
        });
        this.gateway.on('dispatch', (event, data) => {
            this.handleDispatch(event, data);
        });
        this.gateway.on('error', (err) => {
            Logger.error(err.message);
            this.emit('error', err);
        });
        this.gateway.connect();
        return this;
    }
    login(token) {
        return this.run(token);
    }
    registerHybrid(cmd) {
        if (!this.prefixHandler)
            this.prefixHandler = new PrefixHandler();
        this.prefixHandler.addCommand({
            name: cmd.name,
            aliases: cmd.aliases,
            cooldown: cmd.cooldown,
            permissions: cmd.permissions,
            run: cmd.run,
        });
        if (!this.commandHandler)
            this.commandHandler = new CommandHandler();
        const slashBuilder = new SlashCommandBuilder()
            .setName(cmd.name)
            .setDescription(cmd.description);
        if (cmd.options) {
            for (const opt of cmd.options) {
                slashBuilder.addOption(opt);
            }
        }
        this.commandHandler.addCommand({
            data: slashBuilder,
            run: async (ctx) => {
                const args = ctx.interaction?.optionValues.map((value) => String(value)) || [];
                await cmd.run(ctx, args);
            },
        });
        this.bindPrefixListener();
        this.bindInteractionListener();
        this.bindReadyListener();
        void this.syncApplicationCommands();
    }
    handleDispatch(event, data) {
        switch (event) {
            case 'READY': {
                const readyData = data;
                this.user = new User(readyData.user);
                Logger.success(`${this.user.tag} olarak giris yapildi.`);
                this.emit('ready', this.user);
                break;
            }
            case 'MESSAGE_CREATE': {
                const msg = new Message(data, this.rest);
                this.emit('messageCreate', msg);
                break;
            }
            case 'MESSAGE_UPDATE': {
                const msg = new Message(data, this.rest);
                this.emit('messageUpdate', msg);
                break;
            }
            case 'MESSAGE_DELETE': {
                const deleteData = data;
                this.emit('messageDelete', {
                    id: deleteData.id,
                    channelId: deleteData.channel_id,
                    guildId: deleteData.guild_id,
                });
                break;
            }
            case 'GUILD_CREATE': {
                const guild = new Guild(data, this.rest);
                this.guilds.set(guild.id, guild);
                for (const [id, channel] of guild.channels) {
                    this.channels.set(id, channel);
                }
                this.emit('guildCreate', guild);
                break;
            }
            case 'GUILD_DELETE': {
                const guildDeleteData = data;
                this.guilds.delete(guildDeleteData.id);
                this.emit('guildDelete', { id: guildDeleteData.id });
                break;
            }
            case 'INTERACTION_CREATE': {
                const interaction = new Interaction(data, this.rest);
                this.emit('interactionCreate', interaction);
                break;
            }
        }
    }
    async fetchUser(userId) {
        const data = await this.rest.get(`/users/${userId}`);
        const user = new User(data);
        this.users.set(user.id, user);
        return user;
    }
    async fetchChannel(channelId) {
        const data = await this.rest.get(`/channels/${channelId}`);
        const channel = new Channel(data, this.rest);
        this.channels.set(channel.id, channel);
        return channel;
    }
    async fetchGuild(guildId) {
        const data = await this.rest.get(`/guilds/${guildId}?with_counts=true`);
        const guild = new Guild(data, this.rest);
        this.guilds.set(guild.id, guild);
        return guild;
    }
    async registerCommands(commands, guildId) {
        if (!this.user)
            throw new Error('Client not logged in yet. Call this after the ready event.');
        const path = guildId
            ? `/applications/${this.user.id}/guilds/${guildId}/commands`
            : `/applications/${this.user.id}/commands`;
        await this.rest.request(path, {
            method: 'PUT',
            body: commands.map((command) => command.toJSON()),
        });
    }
    setPresence(presence) {
        this.gateway?.updatePresence(this.normalizePresence(presence));
    }
    normalizePresence(presence) {
        return {
            status: presence.status ?? 'online',
            activities: (presence.activities ?? []).map((activity) => ({
                name: activity.name,
                type: activity.type,
                url: activity.url,
            })),
            afk: presence.afk ?? false,
            since: presence.since ?? null,
        };
    }
    destroy() {
        this.gateway?.destroy();
        this.gateway = null;
        this.token = null;
        this.user = null;
    }
    bindPrefixListener() {
        if (this.prefixBound)
            return;
        this.prefixBound = true;
        this.on('messageCreate', (message) => {
            if (!this.prefixHandler)
                return;
            const prefix = this.prefixHandler.getPrefix(message.content);
            if (prefix) {
                message._usedPrefix = prefix;
            }
            const ctx = new Context(message);
            this.middlewareManager.run(ctx, async () => {
                await this.prefixHandler.handle(message);
            }).catch((err) => {
                Logger.error(`Prefix handler hatasi: ${err.message}`);
            });
        });
    }
    bindInteractionListener() {
        if (this.interactionBound)
            return;
        this.interactionBound = true;
        this.on('interactionCreate', (interaction) => {
            const runner = async () => {
                if (this.buttonHandler && interaction.isButton) {
                    const handled = await this.buttonHandler.handle(interaction);
                    if (handled)
                        return;
                }
                if (this.commandHandler) {
                    await this.commandHandler.handle(interaction);
                }
            };
            const ctx = new Context(interaction);
            this.middlewareManager.run(ctx, runner).catch((err) => {
                Logger.error(`Interaction handler hatasi: ${err.message}`);
            });
        });
    }
    bindReadyListener() {
        if (this.readyBound)
            return;
        this.readyBound = true;
        this.once('ready', async () => {
            await this.syncApplicationCommands(this.commandHandler?.guildId);
        });
    }
    async syncApplicationCommands(guildId) {
        if (!this.user || !this.commandHandler)
            return;
        try {
            await this.registerCommands(this.commandHandler.getBuilders(), guildId ?? this.commandHandler.guildId);
            Logger.success(`${this.commandHandler.commands.size} slash komut kaydedildi.`);
        }
        catch (err) {
            const error = err instanceof Error ? err.message : String(err);
            Logger.error(`Slash komutlar kaydedilemedi: ${error}`);
        }
    }
}
//# sourceMappingURL=App.js.map