import { EventEmitter } from 'events';
import { RESTClient } from '../rest/RESTClient';
import { Gateway } from '../gateway/Gateway';
import { Message } from '../structures/Message';
import { User } from '../structures/User';
import { Guild } from '../structures/Guild';
import { Channel } from '../structures/Channel';
import { Interaction } from '../structures/Interaction';
import { SlashCommandBuilder } from '../builders/SlashCommandBuilder';
import { Logger } from '../utils/Logger';
import { PrefixHandler, type PrefixOptions, type PrefixCommand } from '../handlers/PrefixHandler';
import { CommandHandler, type CommandHandlerOptions, type SlashCommand } from '../handlers/CommandHandler';
import { SlashCommandBuilder, type SlashCommandOption } from '../builders/SlashCommandBuilder';
import { FileLoader } from '../utils/FileLoader';
import { MiddlewareManager, type MiddlewareFunction } from '../utils/MiddlewareManager';
import { Context } from '../structures/Context';
import path from 'path';

export interface HybridCommand {
  name: string;
  description: string;
  aliases?: string[];
  cooldown?: number;
  permissions?: any[];
  options?: SlashCommandOption[];
  run: (ctx: Context, args: string[]) => Promise<void> | void;
}
import type { PresenceData, RawMessage, RawGuild, RawInteraction, RawUser, RawChannel } from '../types/raw';
import { Intents } from '../types/constants';

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
  private middlewareManager: MiddlewareManager = new MiddlewareManager();
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
    if (typeof options === 'string' || (typeof options === 'object' && 'folder' in options)) {
      const folderPath = typeof options === 'string' ? options : options.folder!;
      const prefixOptions = typeof options === 'object' ? options : {};
      
      if (!this.prefixHandler) this.prefixHandler = new PrefixHandler(prefixOptions);
      
      FileLoader.loadFiles<PrefixCommand>(folderPath).then((cmds) => {
        for (const cmd of cmds) {
          this.prefixHandler!.addCommand(cmd);
        }
        Logger.success(`${cmds.length} prefix komutu [${folderPath}] klasöründen yüklendi.`);
      });
    } else {
      this.prefixHandler = new PrefixHandler(options);
    }

    this.on('messageCreate', (message) => {
      const ctx = new Context(message);
      this.middlewareManager.run(ctx, async () => {
        await this.prefixHandler!.handle(message);
      }).catch((err: Error) => {
        Logger.error(`Prefix handler hatası: ${err.message}`);
      });
    });
    return this;
  }

  slash(options: string | (CommandHandlerOptions & { folder?: string })): this {
    if (typeof options === 'string' || (typeof options === 'object' && 'folder' in options)) {
      const folderPath = typeof options === 'string' ? options : options.folder!;
      const guildId = typeof options === 'object' ? options.guildId : undefined;
      
      if (!this.commandHandler) this.commandHandler = new CommandHandler({ guildId });

      FileLoader.loadFiles<SlashCommand>(folderPath).then((cmds) => {
        for (const cmd of cmds) {
          this.commandHandler!.addCommand(cmd);
        }
        Logger.success(`${cmds.length} slash komutu [${folderPath}] klasöründen yüklendi.`);
        
        // Eğer bot hazırsa hemen kaydet, değilse ready beklet
        if (this.user) {
          this.registerCommands(this.commandHandler!.getBuilders(), guildId);
        }
      });
    } else {
      this.commandHandler = new CommandHandler(options);
    }

    this.once('ready', async () => {
      if (this.commandHandler) {
        try {
          await this.registerCommands(
            this.commandHandler.getBuilders(),
            (options as CommandHandlerOptions).guildId
          );
          Logger.success(`${this.commandHandler.commands.size} slash komut kaydedildi.`);
        } catch (err) {
          const error = err instanceof Error ? err.message : String(err);
          Logger.error(`Slash komutlar kaydedilemedi: ${error}`);
        }
      }
    });

    this.on('interactionCreate', (interaction) => {
      if (this.commandHandler) {
        const ctx = new Context(interaction);
        this.middlewareManager.run(ctx, async () => {
          await this.commandHandler!.handle(interaction);
        }).catch((err: Error) => {
          Logger.error(`Command handler hatası: ${err.message}`);
        });
      }
    });

    return this;
  }

  use(fn: MiddlewareFunction | { name: string; setup: (app: App) => void }): this {
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
        Logger.success(`${cmds.length} hybrid komutu [${folderPath}] klasöründen yüklendi.`);
      });
    } else {
      this.registerHybrid(options as HybridCommand);
    }
    return this;
  }

  private registerHybrid(cmd: HybridCommand): void {
    // 1. Prefix olarak kaydet
    if (!this.prefixHandler) this.prefixHandler = new PrefixHandler();
    this.prefixHandler.addCommand({
      name: cmd.name,
      aliases: cmd.aliases,
      cooldown: cmd.cooldown,
      permissions: cmd.permissions as any,
      run: cmd.run
    });

    // 2. Slash olarak kaydet
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
        // Slash'tan gelen seçenekleri argümanlara dönüştür (isteğe bağlı)
        const args = ctx.interaction?.options.data.map(o => String(o.value)) || [];
        await cmd.run(ctx, args);
      }
    });
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
      Logger.success(`${events.length} event [${folderPath}] klasöründen yüklendi.`);
    });
    return this;
  }

  run(token: string): this {
    this.token = token.startsWith('Bot ') ? token.slice(4) : token;

    if (!this.token || this.token.trim() === '' || this.token === 'TOKEN_BURAYA') {
      throw new Error('[discordjs-nextgen] Geçerli bir bot tokeni girilmedi. app.run("TOKEN") ile tokeni ver.');
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

  private handleDispatch(event: string, data: unknown): void {
    switch (event) {
      case 'READY': {
        const d = data as { user: RawUser };
        this.user = new User(d.user);
        Logger.success(`${this.user.tag} olarak giriş yapıldı.`);
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
        const d = data as { id: string; channel_id: string; guild_id?: string };
        this.emit('messageDelete', {
          id: d.id,
          channelId: d.channel_id,
          guildId: d.guild_id,
        });
        break;
      }

      case 'GUILD_CREATE': {
        const guild = new Guild(data as RawGuild, this.rest);
        this.guilds.set(guild.id, guild);
        for (const [id, ch] of guild.channels) {
          this.channels.set(id, ch);
        }
        this.emit('guildCreate', guild);
        break;
      }

      case 'GUILD_DELETE': {
        const d = data as { id: string };
        this.guilds.delete(d.id);
        this.emit('guildDelete', { id: d.id });
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

  async registerCommands(
    commands: SlashCommandBuilder[],
    guildId?: string
  ): Promise<void> {
    if (!this.user) throw new Error('Client not logged in yet. Call this after the ready event.');
    const path = guildId
      ? `/applications/${this.user.id}/guilds/${guildId}/commands`
      : `/applications/${this.user.id}/commands`;

    await this.rest.request(path, {
      method: 'PUT',
      body: commands.map((c) => c.toJSON()),
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
}
