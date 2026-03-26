import type { RESTClient } from '../rest/RESTClient';
import type { RawGuild, RawUser, RawChannel } from '../types/raw';
import { Channel } from './Channel';
import { User } from './User';

export class Guild {
  readonly id: string;
  readonly name: string;
  readonly icon: string | null;
  readonly ownerId: string;
  readonly memberCount: number;
  readonly channels: Map<string, Channel>;
  private rest: RESTClient;

  constructor(data: RawGuild, rest: RESTClient) {
    this.id = data.id;
    this.name = data.name;
    this.icon = data.icon ?? null;
    this.ownerId = data.owner_id;
    this.memberCount = data.member_count ?? 0;
    this.rest = rest;

    this.channels = new Map();
    for (const ch of data.channels ?? []) {
      this.channels.set(ch.id, new Channel(ch, rest));
    }
  }

  iconURL(options: { size?: 16 | 32 | 64 | 128 | 256 | 512 | 1024; format?: 'png' | 'jpg' | 'webp' | 'gif' } = {}): string | null {
    if (!this.icon) return null;
    const { size = 128, format = 'png' } = options;
    return `https://cdn.discordapp.com/icons/${this.id}/${this.icon}.${format}?size=${size}`;
  }

  async fetchOwner(): Promise<User> {
    const data = await this.rest.get<RawUser>(`/users/${this.ownerId}`);
    return new User(data);
  }

  async fetchMember(userId: string): Promise<{ user: User; nick: string | null; roles: string[] }> {
    const data = await this.rest.get<{
      user: RawUser;
      nick?: string;
      roles: string[];
    }>(`/guilds/${this.id}/members/${userId}`);
    return {
      user: new User(data.user),
      nick: data.nick ?? null,
      roles: data.roles,
    };
  }

  async ban(userId: string, options: { deleteMessageDays?: number; reason?: string } = {}): Promise<void> {
    await this.rest.request(`/guilds/${this.id}/bans/${userId}`, {
      method: 'PUT',
      body: { delete_message_days: options.deleteMessageDays ?? 0 },
      reason: options.reason,
    });
  }

  async unban(userId: string, reason?: string): Promise<void> {
    await this.rest.delete(`/guilds/${this.id}/bans/${userId}`, reason);
  }

  async kick(userId: string, reason?: string): Promise<void> {
    await this.rest.delete(`/guilds/${this.id}/members/${userId}`, reason);
  }

  async setNickname(userId: string, nick: string | null, reason?: string): Promise<void> {
    await this.rest.patch(
      `/guilds/${this.id}/members/${userId}`,
      { nick },
      reason
    );
  }

  async createChannel(options: {
    name: string;
    type?: number;
    topic?: string;
    parentId?: string;
    reason?: string;
  }): Promise<Channel> {
    const { reason, ...rest } = options;
    const data = await this.rest.request<RawChannel>(`/guilds/${this.id}/channels`, {
      method: 'POST',
      body: {
        name: rest.name,
        type: rest.type ?? 0,
        topic: rest.topic,
        parent_id: rest.parentId,
      },
      reason,
    });
    return new Channel(data, this.rest);
  }

  toString(): string {
    return this.name;
  }
}
