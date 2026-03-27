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
const ButtonHandler_js_1 = require("../handlers/ButtonHandler.js");
const ModalHandler_js_1 = require("../handlers/ModalHandler.js");
const ModalBuilder_js_1 = require("../builders/ModalBuilder.js");
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
        this.buttonHandler = null;
        this.modalHandler = new ModalHandler_js_1.ModalHandlerManager();
        this.middlewareManager = new MiddlewareManager_js_1.MiddlewareManager();
        this.prefixBound = false;
        this.interactionBound = false;
        this.readyBound = false;
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
        if (!this.prefixHandler) {
            this.prefixHandler = new PrefixHandler_js_1.PrefixHandler(typeof options === 'object' ? options : {});
        }
        else if (typeof options === 'object') {
            this.prefixHandler.configure(options);
        }
        if (typeof options === 'string' || (typeof options === 'object' && 'folder' in options)) {
            const folderPath = typeof options === 'string' ? options : options.folder;
            FileLoader_js_1.FileLoader.loadFiles(folderPath).then((cmds) => {
                for (const cmd of cmds) {
                    this.prefixHandler.addCommand(cmd);
                }
                Logger_js_1.Logger.success(`${cmds.length} prefix komutu [${folderPath}] klasorunden yuklendi.`);
            }).catch((err) => {
                Logger_js_1.Logger.error(`Prefix komutlari yuklenemedi: ${err.message}`);
            });
        }
        this.bindPrefixListener();
        return this;
    }
    slash(options) {
        if (!this.commandHandler) {
            this.commandHandler = new CommandHandler_js_1.CommandHandler(typeof options === 'object' ? options : {});
        }
        else if (typeof options === 'object') {
            this.commandHandler.configure(options);
        }
        if (typeof options === 'string' || (typeof options === 'object' && 'folder' in options)) {
            const folderPath = typeof options === 'string' ? options : options.folder;
            const guildId = typeof options === 'object' ? options.guildId : undefined;
            FileLoader_js_1.FileLoader.loadFiles(folderPath).then((cmds) => {
                for (const cmd of cmds) {
                    this.commandHandler.addCommand(cmd);
                }
                Logger_js_1.Logger.success(`${cmds.length} slash komutu [${folderPath}] klasorunden yuklendi.`);
                void this.syncApplicationCommands(guildId);
            }).catch((err) => {
                Logger_js_1.Logger.error(`Slash komutlari yuklenemedi: ${err.message}`);
            });
        }
        this.bindReadyListener();
        this.bindInteractionListener();
        return this;
    }
    button(options, callback) {
        if (!this.buttonHandler) {
            this.buttonHandler = new ButtonHandler_js_1.ButtonHandlerManager(typeof options === 'object' && !('run' in options) ? options : {});
        }
        if (typeof options === 'string' && callback) {
            this.buttonHandler.addButton({ customId: options, run: callback });
        }
        else if (typeof options === 'string' || (typeof options === 'object' && 'folder' in options)) {
            const folderPath = typeof options === 'string' ? options : options.folder;
            FileLoader_js_1.FileLoader.loadFiles(folderPath).then((buttons) => {
                for (const button of buttons) {
                    this.buttonHandler.addButton(button);
                }
                Logger_js_1.Logger.success(`${buttons.length} button handler [${folderPath}] klasorunden yuklendi.`);
            }).catch((err) => {
                Logger_js_1.Logger.error(`Button handlerlari yuklenemedi: ${err.message}`);
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
    buttons(options, callback) {
        return this.button(options, callback);
    }
    modal(options) {
        if (options instanceof ModalBuilder_js_1.Modal) {
            this.modalHandler.addModal(options);
        }
        else if (typeof options === 'object' && 'folder' in options) {
            FileLoader_js_1.FileLoader.loadFiles(options.folder).then((modals) => {
                for (const modal of modals) {
                    this.modalHandler.addModal(modal);
                }
                Logger_js_1.Logger.success(`${modals.length} modal [${options.folder}] klasorunden yuklendi.`);
            }).catch((err) => {
                Logger_js_1.Logger.error(`Modallar yuklenemedi: ${err.message}`);
            });
        }
        this.bindInteractionListener();
        return this;
    }
    get modals() {
        return this.modalHandler.modals;
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
                Logger_js_1.Logger.success(`${cmds.length} hybrid komutu [${folderPath}] klasorunden yuklendi.`);
            }).catch((err) => {
                Logger_js_1.Logger.error(`Hybrid komutlari yuklenemedi: ${err.message}`);
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
        FileLoader_js_1.FileLoader.loadFiles(folderPath).then((events) => {
            for (const event of events) {
                if (event.once) {
                    this.once(event.name, (...args) => event.run(...args));
                }
                else {
                    this.on(event.name, (...args) => event.run(...args));
                }
            }
            Logger_js_1.Logger.success(`${events.length} event [${folderPath}] klasorunden yuklendi.`);
        }).catch((err) => {
            Logger_js_1.Logger.error(`Eventler yuklenemedi: ${err.message}`);
        });
        return this;
    }
    run(token) {
        this.token = token.startsWith('Bot ') ? token.slice(4) : token;
        if (!this.token || this.token.trim() === '' || this.token === 'TOKEN_BURAYA') {
            throw new Error('[discordjs-nextgen] Gecerli bir bot tokeni girilmedi. app.run("TOKEN") ile tokeni ver.');
        }
        this.rest.setToken(this.token);
        this.gateway = new Gateway_js_1.Gateway(this.token, {
            intents: this.resolveIntents(),
            presence: this.options.presence ? this.normalizePresence(this.options.presence) : undefined,
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
    registerHybrid(cmd) {
        if (!this.prefixHandler)
            this.prefixHandler = new PrefixHandler_js_1.PrefixHandler();
        this.prefixHandler.addCommand({
            name: cmd.name,
            aliases: cmd.aliases,
            cooldown: cmd.cooldown,
            permissions: cmd.permissions,
            run: cmd.run,
        });
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
                this.user = new User_js_1.User(readyData.user);
                Logger_js_1.Logger.success(`${this.user.tag} olarak giris yapildi.`);
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
                const deleteData = data;
                this.emit('messageDelete', {
                    id: deleteData.id,
                    channelId: deleteData.channel_id,
                    guildId: deleteData.guild_id,
                });
                break;
            }
            case 'GUILD_CREATE': {
                const guild = new Guild_js_1.Guild(data, this.rest);
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
            const prefixValue = this.prefixHandler.getPrefix(message.content);
            if (prefixValue) {
                message._usedPrefix = prefixValue;
            }
            const ctx = new Context_js_1.Context(message);
            ctx.app = this;
            this.middlewareManager.run(ctx, async () => {
                await this.prefixHandler.handle(message);
            }).catch((err) => {
                Logger_js_1.Logger.error(`Prefix handler hatasi: ${err.message}`);
            });
        });
    }
    bindInteractionListener() {
        if (this.interactionBound)
            return;
        this.interactionBound = true;
        this.on('interactionCreate', (interaction) => {
            const runner = async (ctx) => {
                if (this.buttonHandler && interaction.isButton) {
                    const handled = await this.buttonHandler.handle(interaction);
                    if (handled)
                        return;
                }
                if (interaction.isModalSubmit) {
                    const handled = await this.modalHandler.handle(interaction, ctx);
                    if (handled)
                        return;
                }
                if (this.commandHandler && interaction.isCommand) {
                    await this.commandHandler.handle(interaction);
                }
            };
            const ctx = new Context_js_1.Context(interaction);
            ctx.app = this;
            this.middlewareManager.run(ctx, async () => runner(ctx)).catch((err) => {
                Logger_js_1.Logger.error(`Interaction handler hatasi: ${err.message}`);
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
            Logger_js_1.Logger.success(`${this.commandHandler.commands.size} slash komut kaydedildi.`);
        }
        catch (err) {
            const error = err instanceof Error ? err.message : String(err);
            Logger_js_1.Logger.error(`Slash komutlar kaydedilemedi: ${error}`);
        }
    }
}
exports.App = App;
//# sourceMappingURL=App.js.map