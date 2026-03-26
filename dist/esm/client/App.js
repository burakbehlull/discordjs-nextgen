import { EventEmitter } from 'events';
import { RESTClient } from '../rest/RESTClient';
import { Gateway } from '../gateway/Gateway';
import { Message } from '../structures/Message';
import { User } from '../structures/User';
import { Guild } from '../structures/Guild';
import { Channel } from '../structures/Channel';
import { Interaction } from '../structures/Interaction';
import { Logger } from '../utils/Logger';
import { PrefixHandler } from '../handlers/PrefixHandler';
import { CommandHandler } from '../handlers/CommandHandler';
import { FileLoader } from '../utils/FileLoader';
import { Intents } from '../types/constants';
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
        if (typeof options === 'string' || (typeof options === 'object' && 'folder' in options)) {
            const folderPath = typeof options === 'string' ? options : options.folder;
            const prefixOptions = typeof options === 'object' ? options : {};
            if (!this.prefixHandler)
                this.prefixHandler = new PrefixHandler(prefixOptions);
            FileLoader.loadFiles(folderPath).then((cmds) => {
                for (const cmd of cmds) {
                    this.prefixHandler.addCommand(cmd);
                }
                Logger.success(`${cmds.length} prefix komutu [${folderPath}] klasöründen yüklendi.`);
            });
        }
        else {
            this.prefixHandler = new PrefixHandler(options);
        }
        this.on('messageCreate', (message) => {
            this.prefixHandler.handle(message).catch((err) => {
                Logger.error(`Prefix handler hatası: ${err.message}`);
            });
        });
        return this;
    }
    slash(options) {
        if (typeof options === 'string' || (typeof options === 'object' && 'folder' in options)) {
            const folderPath = typeof options === 'string' ? options : options.folder;
            const guildId = typeof options === 'object' ? options.guildId : undefined;
            if (!this.commandHandler)
                this.commandHandler = new CommandHandler({ guildId });
            FileLoader.loadFiles(folderPath).then((cmds) => {
                for (const cmd of cmds) {
                    this.commandHandler.addCommand(cmd);
                }
                Logger.success(`${cmds.length} slash komutu [${folderPath}] klasöründen yüklendi.`);
                // Eğer bot hazırsa hemen kaydet, değilse ready beklet
                if (this.user) {
                    this.registerCommands(this.commandHandler.getBuilders(), guildId);
                }
            });
        }
        else {
            this.commandHandler = new CommandHandler(options);
        }
        this.once('ready', async () => {
            if (this.commandHandler) {
                try {
                    await this.registerCommands(this.commandHandler.getBuilders(), options.guildId);
                    Logger.success(`${this.commandHandler.commands.size} slash komut kaydedildi.`);
                }
                catch (err) {
                    const error = err instanceof Error ? err.message : String(err);
                    Logger.error(`Slash komutlar kaydedilemedi: ${error}`);
                }
            }
        });
        this.on('interactionCreate', (interaction) => {
            if (this.commandHandler) {
                this.commandHandler.handle(interaction).catch((err) => {
                    Logger.error(`Command handler hatası: ${err.message}`);
                });
            }
        });
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
            Logger.success(`${events.length} event [${folderPath}] klasöründen yüklendi.`);
        });
        return this;
    }
    login(token) {
        this.token = token.startsWith('Bot ') ? token.slice(4) : token;
        if (!this.token || this.token.trim() === '' || this.token === 'TOKEN_BURAYA') {
            throw new Error('[discordjs-nextgen] Geçerli bir bot tokeni girilmedi. app.login("TOKEN") ile tokeni ver.');
        }
        this.rest.setToken(this.token);
        this.gateway = new Gateway(this.token, {
            intents: this.resolveIntents(),
            presence: this.options.presence,
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
    handleDispatch(event, data) {
        switch (event) {
            case 'READY': {
                const d = data;
                this.user = new User(d.user);
                Logger.success(`${this.user.tag} olarak giriş yapıldı.`);
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
                const d = data;
                this.emit('messageDelete', {
                    id: d.id,
                    channelId: d.channel_id,
                    guildId: d.guild_id,
                });
                break;
            }
            case 'GUILD_CREATE': {
                const guild = new Guild(data, this.rest);
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
//# sourceMappingURL=App.js.map