"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = void 0;
const events_1 = require("events");
const RESTClient_js_1 = require("../rest/RESTClient.js");
const Gateway_js_1 = require("../gateway/Gateway.js");
const Message_js_1 = require("../structures/Message.js");
const User_js_1 = require("../structures/User.js");
const Guild_js_1 = require("../structures/Guild.js");
const Channel_js_1 = require("../structures/Channel.js");
const Interaction_js_1 = require("../structures/Interaction.js");
const Logger_js_1 = require("../utils/Logger.js");
const PrefixHandler_js_1 = require("../handlers/PrefixHandler.js");
const CommandHandler_js_1 = require("../handlers/CommandHandler.js");
const SlashCommandBuilder_js_1 = require("../builders/SlashCommandBuilder.js");
const FileLoader_js_1 = require("../utils/FileLoader.js");
const MiddlewareManager_js_1 = require("../utils/MiddlewareManager.js");
const Context_js_1 = require("../structures/Context.js");
const constants_js_1 = require("../types/constants.js");
class App extends events_1.EventEmitter {
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
        this.middlewareManager = new MiddlewareManager_js_1.MiddlewareManager();
        this.user = null;
        this.rest = new RESTClient_js_1.RESTClient('');
    }
    resolveIntents() {
        const { intents = constants_js_1.Intents.ALL } = this.options;
        if (typeof intents === 'number')
            return intents;
        return intents.reduce((acc, key) => acc | constants_js_1.Intents[key], 0);
    }
    prefix(options) {
        if (typeof options === 'string' || (typeof options === 'object' && 'folder' in options)) {
            const folderPath = typeof options === 'string' ? options : options.folder;
            const prefixOptions = typeof options === 'object' ? options : {};
            if (!this.prefixHandler)
                this.prefixHandler = new PrefixHandler_js_1.PrefixHandler(prefixOptions);
            FileLoader_js_1.FileLoader.loadFiles(folderPath).then((cmds) => {
                for (const cmd of cmds) {
                    this.prefixHandler.addCommand(cmd);
                }
                Logger_js_1.Logger.success(`${cmds.length} prefix komutu [${folderPath}] klasöründen yüklendi.`);
            });
        }
        else {
            this.prefixHandler = new PrefixHandler_js_1.PrefixHandler(options);
        }
        this.on('messageCreate', (message) => {
            const ctx = new Context_js_1.Context(message);
            this.middlewareManager.run(ctx, async () => {
                await this.prefixHandler.handle(message);
            }).catch((err) => {
                Logger_js_1.Logger.error(`Prefix handler hatası: ${err.message}`);
            });
        });
        return this;
    }
    slash(options) {
        if (typeof options === 'string' || (typeof options === 'object' && 'folder' in options)) {
            const folderPath = typeof options === 'string' ? options : options.folder;
            const guildId = typeof options === 'object' ? options.guildId : undefined;
            if (!this.commandHandler)
                this.commandHandler = new CommandHandler_js_1.CommandHandler({ guildId });
            FileLoader_js_1.FileLoader.loadFiles(folderPath).then((cmds) => {
                for (const cmd of cmds) {
                    this.commandHandler.addCommand(cmd);
                }
                Logger_js_1.Logger.success(`${cmds.length} slash komutu [${folderPath}] klasöründen yüklendi.`);
                // Eğer bot hazırsa hemen kaydet, değilse ready beklet
                if (this.user) {
                    this.registerCommands(this.commandHandler.getBuilders(), guildId);
                }
            });
        }
        else {
            this.commandHandler = new CommandHandler_js_1.CommandHandler(options);
        }
        this.once('ready', async () => {
            if (this.commandHandler) {
                try {
                    await this.registerCommands(this.commandHandler.getBuilders(), options.guildId);
                    Logger_js_1.Logger.success(`${this.commandHandler.commands.size} slash komut kaydedildi.`);
                }
                catch (err) {
                    const error = err instanceof Error ? err.message : String(err);
                    Logger_js_1.Logger.error(`Slash komutlar kaydedilemedi: ${error}`);
                }
            }
        });
        this.on('interactionCreate', (interaction) => {
            if (this.commandHandler) {
                const ctx = new Context_js_1.Context(interaction);
                this.middlewareManager.run(ctx, async () => {
                    await this.commandHandler.handle(interaction);
                }).catch((err) => {
                    Logger_js_1.Logger.error(`Command handler hatası: ${err.message}`);
                });
            }
        });
        return this;
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
            FileLoader_js_1.FileLoader.loadFiles(folderPath).then((cmds) => {
                for (const cmd of cmds) {
                    this.registerHybrid(cmd);
                }
                Logger_js_1.Logger.success(`${cmds.length} hybrid komutu [${folderPath}] klasöründen yüklendi.`);
            });
        }
        else {
            this.registerHybrid(options);
        }
        return this;
    }
    registerHybrid(cmd) {
        // 1. Prefix olarak kaydet
        if (!this.prefixHandler)
            this.prefixHandler = new PrefixHandler_js_1.PrefixHandler();
        this.prefixHandler.addCommand({
            name: cmd.name,
            aliases: cmd.aliases,
            cooldown: cmd.cooldown,
            permissions: cmd.permissions,
            run: cmd.run
        });
        // 2. Slash olarak kaydet
        if (!this.commandHandler)
            this.commandHandler = new CommandHandler_js_1.CommandHandler();
        const slashBuilder = new SlashCommandBuilder_js_1.SlashCommandBuilder()
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
                // Slash'tan gelen seçenekleri argümanlara dönüştür
                const args = ctx.interaction?.optionValues.map(v => String(v)) || [];
                await cmd.run(ctx, args);
            }
        });
    }
    commands(options) {
        return this.slash(options);
    }
    events(folderPath) {
        FileLoader_js_1.FileLoader.loadFiles(folderPath).then((events) => {
            for (const event of events) {
                if (event.once) {
                    this.once(event.name, (...args) => event.run(...args));
                }
                else {
                    this.on(event.name, (...args) => event.run(...args));
                }
            }
            Logger_js_1.Logger.success(`${events.length} event [${folderPath}] klasöründen yüklendi.`);
        });
        return this;
    }
    run(token) {
        this.token = token.startsWith('Bot ') ? token.slice(4) : token;
        if (!this.token || this.token.trim() === '' || this.token === 'TOKEN_BURAYA') {
            throw new Error('[discordjs-nextgen] Geçerli bir bot tokeni girilmedi. app.run("TOKEN") ile tokeni ver.');
        }
        this.rest.setToken(this.token);
        this.gateway = new Gateway_js_1.Gateway(this.token, {
            intents: this.resolveIntents(),
            presence: this.options.presence,
        });
        this.gateway.on('dispatch', (event, data) => {
            this.handleDispatch(event, data);
        });
        this.gateway.on('error', (err) => {
            Logger_js_1.Logger.error(err.message);
            this.emit('error', err);
        });
        this.gateway.connect();
        return this;
    }
    login(token) {
        return this.run(token);
    }
    handleDispatch(event, data) {
        switch (event) {
            case 'READY': {
                const d = data;
                this.user = new User_js_1.User(d.user);
                Logger_js_1.Logger.success(`${this.user.tag} olarak giriş yapıldı.`);
                this.emit('ready', this.user);
                break;
            }
            case 'MESSAGE_CREATE': {
                const msg = new Message_js_1.Message(data, this.rest);
                this.emit('messageCreate', msg);
                break;
            }
            case 'MESSAGE_UPDATE': {
                const msg = new Message_js_1.Message(data, this.rest);
                this.emit('messageUpdate', msg);
                break;
            }
            case 'MESSAGE_DELETE': {
                const d = data;
                this.emit('messageDelete', {
                    id: d.id,
                    channelId: d.channel_id,
                    guildId: d.guild_id,
                });
                break;
            }
            case 'GUILD_CREATE': {
                const guild = new Guild_js_1.Guild(data, this.rest);
                this.guilds.set(guild.id, guild);
                for (const [id, ch] of guild.channels) {
                    this.channels.set(id, ch);
                }
                this.emit('guildCreate', guild);
                break;
            }
            case 'GUILD_DELETE': {
                const d = data;
                this.guilds.delete(d.id);
                this.emit('guildDelete', { id: d.id });
                break;
            }
            case 'INTERACTION_CREATE': {
                const interaction = new Interaction_js_1.Interaction(data, this.rest);
                this.emit('interactionCreate', interaction);
                break;
            }
        }
    }
    async fetchUser(userId) {
        const data = await this.rest.get(`/users/${userId}`);
        const user = new User_js_1.User(data);
        this.users.set(user.id, user);
        return user;
    }
    async fetchChannel(channelId) {
        const data = await this.rest.get(`/channels/${channelId}`);
        const channel = new Channel_js_1.Channel(data, this.rest);
        this.channels.set(channel.id, channel);
        return channel;
    }
    async fetchGuild(guildId) {
        const data = await this.rest.get(`/guilds/${guildId}?with_counts=true`);
        const guild = new Guild_js_1.Guild(data, this.rest);
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
            body: commands.map((c) => c.toJSON()),
        });
    }
    setPresence(presence) {
        this.gateway?.updatePresence(presence);
    }
    destroy() {
        this.gateway?.destroy();
        this.gateway = null;
        this.token = null;
        this.user = null;
    }
}
exports.App = App;
//# sourceMappingURL=App.js.map