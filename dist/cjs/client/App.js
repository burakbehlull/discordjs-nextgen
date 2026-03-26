"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = void 0;
const events_1 = require("events");
const RESTClient_1 = require("../rest/RESTClient");
const Gateway_1 = require("../gateway/Gateway");
const Message_1 = require("../structures/Message");
const User_1 = require("../structures/User");
const Guild_1 = require("../structures/Guild");
const Channel_1 = require("../structures/Channel");
const Interaction_1 = require("../structures/Interaction");
const Logger_1 = require("../utils/Logger");
const PrefixHandler_1 = require("../handlers/PrefixHandler");
const CommandHandler_1 = require("../handlers/CommandHandler");
const FileLoader_1 = require("../utils/FileLoader");
const constants_1 = require("../types/constants");
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
        this.user = null;
        this.rest = new RESTClient_1.RESTClient('');
    }
    resolveIntents() {
        const { intents = constants_1.Intents.ALL } = this.options;
        if (typeof intents === 'number')
            return intents;
        return intents.reduce((acc, key) => acc | constants_1.Intents[key], 0);
    }
    prefix(options) {
        if (typeof options === 'string' || (typeof options === 'object' && 'folder' in options)) {
            const folderPath = typeof options === 'string' ? options : options.folder;
            const prefixOptions = typeof options === 'object' ? options : {};
            if (!this.prefixHandler)
                this.prefixHandler = new PrefixHandler_1.PrefixHandler(prefixOptions);
            FileLoader_1.FileLoader.loadFiles(folderPath).then((cmds) => {
                for (const cmd of cmds) {
                    this.prefixHandler.addCommand(cmd);
                }
                Logger_1.Logger.success(`${cmds.length} prefix komutu [${folderPath}] klasöründen yüklendi.`);
            });
        }
        else {
            this.prefixHandler = new PrefixHandler_1.PrefixHandler(options);
        }
        this.on('messageCreate', (message) => {
            this.prefixHandler.handle(message).catch((err) => {
                Logger_1.Logger.error(`Prefix handler hatası: ${err.message}`);
            });
        });
        return this;
    }
    slash(options) {
        if (typeof options === 'string' || (typeof options === 'object' && 'folder' in options)) {
            const folderPath = typeof options === 'string' ? options : options.folder;
            const guildId = typeof options === 'object' ? options.guildId : undefined;
            if (!this.commandHandler)
                this.commandHandler = new CommandHandler_1.CommandHandler({ guildId });
            FileLoader_1.FileLoader.loadFiles(folderPath).then((cmds) => {
                for (const cmd of cmds) {
                    this.commandHandler.addCommand(cmd);
                }
                Logger_1.Logger.success(`${cmds.length} slash komutu [${folderPath}] klasöründen yüklendi.`);
                // Eğer bot hazırsa hemen kaydet, değilse ready beklet
                if (this.user) {
                    this.registerCommands(this.commandHandler.getBuilders(), guildId);
                }
            });
        }
        else {
            this.commandHandler = new CommandHandler_1.CommandHandler(options);
        }
        this.once('ready', async () => {
            if (this.commandHandler) {
                try {
                    await this.registerCommands(this.commandHandler.getBuilders(), options.guildId);
                    Logger_1.Logger.success(`${this.commandHandler.commands.size} slash komut kaydedildi.`);
                }
                catch (err) {
                    const error = err instanceof Error ? err.message : String(err);
                    Logger_1.Logger.error(`Slash komutlar kaydedilemedi: ${error}`);
                }
            }
        });
        this.on('interactionCreate', (interaction) => {
            if (this.commandHandler) {
                this.commandHandler.handle(interaction).catch((err) => {
                    Logger_1.Logger.error(`Command handler hatası: ${err.message}`);
                });
            }
        });
        return this;
    }
    commands(options) {
        return this.slash(options);
    }
    events(folderPath) {
        FileLoader_1.FileLoader.loadFiles(folderPath).then((events) => {
            for (const event of events) {
                if (event.once) {
                    this.once(event.name, (...args) => event.run(...args));
                }
                else {
                    this.on(event.name, (...args) => event.run(...args));
                }
            }
            Logger_1.Logger.success(`${events.length} event [${folderPath}] klasöründen yüklendi.`);
        });
        return this;
    }
    run(token) {
        this.token = token.startsWith('Bot ') ? token.slice(4) : token;
        if (!this.token || this.token.trim() === '' || this.token === 'TOKEN_BURAYA') {
            throw new Error('[discordjs-nextgen] Geçerli bir bot tokeni girilmedi. app.run("TOKEN") ile tokeni ver.');
        }
        this.rest.setToken(this.token);
        this.gateway = new Gateway_1.Gateway(this.token, {
            intents: this.resolveIntents(),
            presence: this.options.presence,
        });
        this.gateway.on('dispatch', (event, data) => {
            this.handleDispatch(event, data);
        });
        this.gateway.on('error', (err) => {
            Logger_1.Logger.error(err.message);
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
                this.user = new User_1.User(d.user);
                Logger_1.Logger.success(`${this.user.tag} olarak giriş yapıldı.`);
                this.emit('ready', this.user);
                break;
            }
            case 'MESSAGE_CREATE': {
                const msg = new Message_1.Message(data, this.rest);
                this.emit('messageCreate', msg);
                break;
            }
            case 'MESSAGE_UPDATE': {
                const msg = new Message_1.Message(data, this.rest);
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
                const guild = new Guild_1.Guild(data, this.rest);
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
                const interaction = new Interaction_1.Interaction(data, this.rest);
                this.emit('interactionCreate', interaction);
                break;
            }
        }
    }
    async fetchUser(userId) {
        const data = await this.rest.get(`/users/${userId}`);
        const user = new User_1.User(data);
        this.users.set(user.id, user);
        return user;
    }
    async fetchChannel(channelId) {
        const data = await this.rest.get(`/channels/${channelId}`);
        const channel = new Channel_1.Channel(data, this.rest);
        this.channels.set(channel.id, channel);
        return channel;
    }
    async fetchGuild(guildId) {
        const data = await this.rest.get(`/guilds/${guildId}?with_counts=true`);
        const guild = new Guild_1.Guild(data, this.rest);
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