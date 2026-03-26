import { EventEmitter } from 'events';
import { RESTClient } from '../rest/RESTClient.js';
import { Gateway } from '../gateway/Gateway.js';
import { Message } from '../structures/Message.js';
import { User } from '../structures/User.js';
import { Guild } from '../structures/Guild.js';
import { Channel } from '../structures/Channel.js';
import { Interaction } from '../structures/Interaction.js';
import { Logger } from '../utils/Logger.js';
import { PrefixHandler, type PrefixOptions, type PrefixCommand } from '../handlers/PrefixHandler.js';
import { CommandHandler, type CommandHandlerOptions, type SlashCommand } from '../handlers/CommandHandler.js';
import { ButtonHandlerManager, type ButtonHandler, type ButtonHandlerOptions } from '../handlers/ButtonHandler.js';
import { SlashCommandBuilder, type SlashCommandOption } from '../builders/SlashCommandBuilder.js';
import { FileLoader } from '../utils/FileLoader.js';
import { MiddlewareManager, type MiddlewareFunction } from '../utils/MiddlewareManager.js';
import { Context } from '../structures/Context.js';
import type { PresenceData, RawMessage, RawGuild, RawInteraction, RawUser, RawChannel } from '../types/raw.js';
import { Intents } from '../types/constants.js';

export interface HybridCommand {
  name: string;
  description: string;
  aliases?: string[];
  cooldown?: number;
  permissions?: any[];
  options?: SlashCommandOption[];
  run: (ctx: Context, args: string[]) => Promise<void> | void;
}

export interface AppOptions {
  intents?: number | (keyof typeof Intents)[];
  presence?: PresenceData;
}

export interface AppEvents {
  ready: [user: User];
  messageCreate: [message: Message];
  messageUpdate: [message: Message];
  messageDelete: [data: { id: string; channelId: string; guildId?: string }];
  interactionCreate: [interaction: Interaction];
  guildCreate: [guild: Guild];
  guildDelete: [data: { id: string }];
  error: [error: Error];
}

export interface AppEvent<K extends keyof AppEvents = keyof AppEvents> {
  name: K;
  once?: boolean;
  run: (...args: AppEvents[K]) => Promise<void> | void;
}

export interface AppPlugin {
  name: string;
  setup: (app: App) => void;
}

export interface App {
  on<K extends keyof AppEvents>(event: K, listener: (...args: AppEvents[K]) => void): this;
  once<K extends keyof AppEvents>(event: K, listener: (...args: AppEvents[K]) => void): this;
  off<K extends keyof AppEvents>(event: K, listener: (...args: AppEvents[K]) => void): this;
  emit<K extends keyof AppEvents>(event: K, ...args: AppEvents[K]): boolean;
}

export interface HybridOptions extends Partial<Omit<HybridCommand, 'run' | 'name' | 'description'>> {
  folder?: string;
}

export class App extends EventEmitter {
  readonly rest: RESTClient;
  readonly guilds: Map<string, Guild> = new Map();
  readonly users: Map<string, User> = new Map();
  readonly channels: Map<string, Channel> = new Map();

  private gateway: Gateway | null = null;
  private token: string | null = null;
  private prefixHandler: PrefixHandler | null = null;
  private commandHandler: CommandHandler | null = null;
  private buttonHandler: ButtonHandlerManager | null = null;
  private middlewareManager: MiddlewareManager = new MiddlewareManager();
  private prefixBound = false;
  private interactionBound = false;
  private readyBound = false;
  user: User | null = null;

  constructor(private options: AppOptions = {}) {
    super();
    this.rest = new RESTClient('');
  }

  private resolveIntents(): number {
    const { intents = Intents.ALL } = this.options;
    if (typeof intents === 'number') return intents;
    return intents.reduce((acc, key) => acc | Intents[key], 0);
  }

  prefix(options: string | (PrefixOptions & { folder?: string })): this {
    if (!this.prefixHandler) {
      this.prefixHandler = new PrefixHandler(typeof options === 'object' ? options : {});
    } else if (typeof options === 'object') {
      this.prefixHandler.configure(options);
    }

    if (typeof options === 'string' || (typeof options === 'object' && 'folder' in options)) {
      const folderPath = typeof options === 'string' ? options : options.folder!;

      FileLoader.loadFiles<PrefixCommand>(folderPath).then((cmds) => {
        for (const cmd of cmds) {
          this.prefixHandler!.addCommand(cmd);
        }
        Logger.success(`${cmds.length} prefix komutu [${folderPath}] klasorunden yuklendi.`);
      }).catch((err: Error) => {
        Logger.error(`Prefix komutlari yuklenemedi: ${err.message}`);
      });
    }

    this.bindPrefixListener();
    return this;
  }

  slash(options: string | (CommandHandlerOptions & { folder?: string })): this {
    if (!this.commandHandler) {
      this.commandHandler = new CommandHandler(typeof options === 'object' ? options : {});
    } else if (typeof options === 'object') {
      this.commandHandler.configure(options);
    }

    if (typeof options === 'string' || (typeof options === 'object' && 'folder' in options)) {
      const folderPath = typeof options === 'string' ? options : options.folder!;
      const guildId = typeof options === 'object' ? options.guildId : undefined;

      FileLoader.loadFiles<SlashCommand>(folderPath).then((cmds) => {
        for (const cmd of cmds) {
          this.commandHandler!.addCommand(cmd);
        }
        Logger.success(`${cmds.length} slash komutu [${folderPath}] klasorunden yuklendi.`);
        void this.syncApplicationCommands(guildId);
      }).catch((err: Error) => {
        Logger.error(`Slash komutlari yuklenemedi: ${err.message}`);
      });
    }

    this.bindReadyListener();
    this.bindInteractionListener();
    return this;
  }

  button(options: string | ButtonHandler | (ButtonHandlerOptions & { folder?: string })): this {
    if (!this.buttonHandler) {
      this.buttonHandler = new ButtonHandlerManager(
        typeof options === 'object' && !('run' in options) ? options : {}
      );
    }

    if (typeof options === 'string' || (typeof options === 'object' && 'folder' in options)) {
      const folderPath = typeof options === 'string' ? options : options.folder!;

      FileLoader.loadFiles<ButtonHandler>(folderPath).then((buttons) => {
        for (const button of buttons) {
          this.buttonHandler!.addButton(button);
        }

        Logger.success(`${buttons.length} button handler [${folderPath}] klasorunden yuklendi.`);
      }).catch((err: Error) => {
        Logger.error(`Button handlerlari yuklenemedi: ${err.message}`);
      });
    } else if ('run' in options) {
      this.buttonHandler.addButton(options);
    } else if ('buttons' in options && options.buttons) {
      this.buttonHandler.addButtons(options.buttons);
    }

    this.bindInteractionListener();
    return this;
  }

  buttons(options: string | ButtonHandler | (ButtonHandlerOptions & { folder?: string })): this {
    return this.button(options);
  }

  use(fn: MiddlewareFunction | AppPlugin): this {
    if (typeof fn === 'function') {
      this.middlewareManager.use(fn);
    } else if (typeof fn === 'object' && 'setup' in fn) {
      fn.setup(this);
    }
    return this;
  }

  command(options: string | (HybridOptions & { folder: string }) | HybridCommand): this {
    if (typeof options === 'string' || (typeof options === 'object' && 'folder' in options)) {
      const folderPath = typeof options === 'string' ? options : options.folder!;
      FileLoader.loadFiles<HybridCommand>(folderPath).then((cmds) => {
        for (const cmd of cmds) {
          this.registerHybrid(cmd);
        }
        Logger.success(`${cmds.length} hybrid komutu [${folderPath}] klasorunden yuklendi.`);
      }).catch((err: Error) => {
        Logger.error(`Hybrid komutlari yuklenemedi: ${err.message}`);
      });
    } else {
      this.registerHybrid(options as HybridCommand);
    }
    return this;
  }

  commands(options: CommandHandlerOptions): this {
    return this.slash(options);
  }

  events(folderPath: string): this {
    FileLoader.loadFiles<AppEvent>(folderPath).then((events) => {
      for (const event of events) {
        if (event.once) {
          this.once(event.name, (...args) => event.run(...args));
        } else {
          this.on(event.name, (...args) => event.run(...args));
        }
      }
      Logger.success(`${events.length} event [${folderPath}] klasorunden yuklendi.`);
    }).catch((err: Error) => {
      Logger.error(`Eventler yuklenemedi: ${err.message}`);
    });
    return this;
  }

  run(token: string): this {
    this.token = token.startsWith('Bot ') ? token.slice(4) : token;

    if (!this.token || this.token.trim() === '' || this.token === 'TOKEN_BURAYA') {
      throw new Error('[discordjs-nextgen] Gecerli bir bot tokeni girilmedi. app.run("TOKEN") ile tokeni ver.');
    }

    this.rest.setToken(this.token);

    this.gateway = new Gateway(this.token, {
      intents: this.resolveIntents(),
      presence: this.options.presence,
    });

    this.gateway.on('dispatch', (event: string, data: unknown) => {
      this.handleDispatch(event, data);
    });

    this.gateway.on('error', (err: Error) => {
      Logger.error(err.message);
      this.emit('error', err);
    });

    this.gateway.connect();
    return this;
  }

  login(token: string): this {
    return this.run(token);
  }

  private registerHybrid(cmd: HybridCommand): void {
    if (!this.prefixHandler) this.prefixHandler = new PrefixHandler();
    this.prefixHandler.addCommand({
      name: cmd.name,
      aliases: cmd.aliases,
      cooldown: cmd.cooldown,
      permissions: cmd.permissions as any,
      run: cmd.run,
    });

    if (!this.commandHandler) this.commandHandler = new CommandHandler();
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

  private handleDispatch(event: string, data: unknown): void {
    switch (event) {
      case 'READY': {
        const readyData = data as { user: RawUser };
        this.user = new User(readyData.user);
        Logger.success(`${this.user.tag} olarak giris yapildi.`);
        this.emit('ready', this.user);
        break;
      }

      case 'MESSAGE_CREATE': {
        const msg = new Message(data as RawMessage, this.rest);
        this.emit('messageCreate', msg);
        break;
      }

      case 'MESSAGE_UPDATE': {
        const msg = new Message(data as RawMessage, this.rest);
        this.emit('messageUpdate', msg);
        break;
      }

      case 'MESSAGE_DELETE': {
        const deleteData = data as { id: string; channel_id: string; guild_id?: string };
        this.emit('messageDelete', {
          id: deleteData.id,
          channelId: deleteData.channel_id,
          guildId: deleteData.guild_id,
        });
        break;
      }

      case 'GUILD_CREATE': {
        const guild = new Guild(data as RawGuild, this.rest);
        this.guilds.set(guild.id, guild);
        for (const [id, channel] of guild.channels) {
          this.channels.set(id, channel);
        }
        this.emit('guildCreate', guild);
        break;
      }

      case 'GUILD_DELETE': {
        const guildDeleteData = data as { id: string };
        this.guilds.delete(guildDeleteData.id);
        this.emit('guildDelete', { id: guildDeleteData.id });
        break;
      }

      case 'INTERACTION_CREATE': {
        const interaction = new Interaction(data as RawInteraction, this.rest);
        this.emit('interactionCreate', interaction);
        break;
      }
    }
  }

  async fetchUser(userId: string): Promise<User> {
    const data = await this.rest.get<RawUser>(`/users/${userId}`);
    const user = new User(data);
    this.users.set(user.id, user);
    return user;
  }

  async fetchChannel(channelId: string): Promise<Channel> {
    const data = await this.rest.get<RawChannel>(`/channels/${channelId}`);
    const channel = new Channel(data, this.rest);
    this.channels.set(channel.id, channel);
    return channel;
  }

  async fetchGuild(guildId: string): Promise<Guild> {
    const data = await this.rest.get<RawGuild>(`/guilds/${guildId}?with_counts=true`);
    const guild = new Guild(data, this.rest);
    this.guilds.set(guild.id, guild);
    return guild;
  }

  async registerCommands(commands: SlashCommandBuilder[], guildId?: string): Promise<void> {
    if (!this.user) throw new Error('Client not logged in yet. Call this after the ready event.');
    const path = guildId
      ? `/applications/${this.user.id}/guilds/${guildId}/commands`
      : `/applications/${this.user.id}/commands`;

    await this.rest.request(path, {
      method: 'PUT',
      body: commands.map((command) => command.toJSON()),
    });
  }

  setPresence(presence: PresenceData): void {
    this.gateway?.updatePresence(presence);
  }

  destroy(): void {
    this.gateway?.destroy();
    this.gateway = null;
    this.token = null;
    this.user = null;
  }

  private bindPrefixListener(): void {
    if (this.prefixBound) return;
    this.prefixBound = true;

    this.on('messageCreate', (message) => {
      if (!this.prefixHandler) return;

      const ctx = new Context(message);
      this.middlewareManager.run(ctx, async () => {
        await this.prefixHandler!.handle(message);
      }).catch((err: Error) => {
        Logger.error(`Prefix handler hatasi: ${err.message}`);
      });
    });
  }

  private bindInteractionListener(): void {
    if (this.interactionBound) return;
    this.interactionBound = true;

    this.on('interactionCreate', (interaction) => {
      const runner = async (): Promise<void> => {
        if (this.buttonHandler && interaction.isButton) {
          const handled = await this.buttonHandler.handle(interaction);
          if (handled) return;
        }

        if (this.commandHandler) {
          await this.commandHandler.handle(interaction);
        }
      };

      const ctx = new Context(interaction);
      this.middlewareManager.run(ctx, runner).catch((err: Error) => {
        Logger.error(`Interaction handler hatasi: ${err.message}`);
      });
    });
  }

  private bindReadyListener(): void {
    if (this.readyBound) return;
    this.readyBound = true;

    this.once('ready', async () => {
      await this.syncApplicationCommands(this.commandHandler?.guildId);
    });
  }

  private async syncApplicationCommands(guildId?: string): Promise<void> {
    if (!this.user || !this.commandHandler) return;

    try {
      await this.registerCommands(this.commandHandler.getBuilders(), guildId ?? this.commandHandler.guildId);
      Logger.success(`${this.commandHandler.commands.size} slash komut kaydedildi.`);
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      Logger.error(`Slash komutlar kaydedilemedi: ${error}`);
    }
  }
}
