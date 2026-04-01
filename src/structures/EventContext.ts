import type { RESTClient } from '../rest/RESTClient.js';
import type { App, AppOptions } from '../client/App.js';
import type { User } from './User.js';
import type { Guild } from './Guild.js';
import type { Channel } from './Channel.js';

export class EventContext {
  constructor(private readonly _app: App) {}

  get app(): App {
    return this._app;
  }

  get client(): App {
    return this._app;
  }

  get options(): AppOptions {
    return this._app.options;
  }

  get rest(): RESTClient {
    return this._app.rest;
  }

  get user(): User | null {
    return this._app.user;
  }

  get guilds(): Map<string, Guild> {
    return this._app.guilds;
  }

  get users(): Map<string, User> {
    return this._app.users;
  }

  get channels(): Map<string, Channel> {
    return this._app.channels;
  }

  fetchUser(userId: string): Promise<User> {
    return this._app.fetchUser(userId);
  }

  fetchChannel(channelId: string): Promise<Channel> {
    return this._app.fetchChannel(channelId);
  }

  fetchGuild(guildId: string): Promise<Guild> {
    return this._app.fetchGuild(guildId);
  }
}
