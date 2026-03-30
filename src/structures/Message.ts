import type { RESTClient } from '../rest/RESTClient.js';
import type { RawMessage, RawMember } from '../types/raw.js';
import { User } from './User.js';
import { Channel } from './Channel.js';
import type { EmbedBuilder } from '../builders/EmbedBuilder.js';
import type { ActionRowBuilder } from '../builders/ButtonBuilder.js';

type MessageComponentLike = ActionRowBuilder | Record<string, unknown>;

export interface Member {
  nick: string | null;
  roles: string[];
  joinedAt: Date;
  permissions: string | null;
}

export interface MessageReplyOptions {
  content?: string;
  embeds?: EmbedBuilder[];
  components?: MessageComponentLike[];
  flags?: number;
}

export class Message {
  readonly id: string;
  readonly channelId: string;
  readonly guildId: string | null;
  readonly author: User;
  readonly content: string;
  readonly createdAt: Date;
  readonly editedAt: Date | null;
  readonly pinned: boolean;
  readonly type: number;
  readonly member: Member | null;
  public _usedPrefix: string | null = null;
  private rest: RESTClient;

  constructor(data: RawMessage, rest: RESTClient) {
    this.id = data.id;
    this.channelId = data.channel_id;
    this.guildId = data.guild_id ?? null;
    this.author = new User(data.author);
    this.content = data.content;
    this.createdAt = new Date(data.timestamp);
    this.editedAt = data.edited_timestamp ? new Date(data.edited_timestamp) : null;
    this.pinned = data.pinned;
    this.type = data.type;
    this.member = data.member ? Message.parseMember(data.member) : null;
    this.rest = rest;
  }

  private static parseMember(raw: RawMember): Member {
    return {
      nick: raw.nick ?? null,
      roles: raw.roles,
      joinedAt: new Date(raw.joined_at),
      permissions: raw.permissions ?? null,
    };
  }

  get memberPermissions(): string | null {
    return this.member?.permissions ?? null;
  }

  get channel(): Channel {
    return new Channel({ id: this.channelId, type: 0, guild_id: this.guildId ?? undefined }, this.rest);
  }

  async reply(options: string | MessageReplyOptions): Promise<Message> {
    const payload =
      typeof options === 'string'
        ? { content: options }
        : {
            content: options.content,
            embeds: options.embeds?.map((e) => e.toJSON()),
            components: options.components?.map((r) => (typeof (r as any)?.toJSON === 'function' ? (r as any).toJSON() : r)),
            flags: options.flags,
          };

    const data = await this.rest.post<RawMessage>(`/channels/${this.channelId}/messages`, {
      ...payload,
      message_reference: { message_id: this.id },
    });
    return new Message(data, this.rest);
  }

  async edit(options: string | MessageReplyOptions): Promise<Message> {
    const payload =
      typeof options === 'string'
        ? { content: options }
        : {
            content: options.content,
            embeds: options.embeds?.map((e) => e.toJSON()),
            components: options.components?.map((r) => (typeof (r as any)?.toJSON === 'function' ? (r as any).toJSON() : r)),
            flags: options.flags,
          };

    const data = await this.rest.patch<RawMessage>(
      `/channels/${this.channelId}/messages/${this.id}`,
      payload as Record<string, unknown>
    );
    return new Message(data, this.rest);
  }

  async delete(reason?: string): Promise<void> {
    await this.rest.delete(`/channels/${this.channelId}/messages/${this.id}`, reason);
  }

  toString(): string {
    return this.content;
  }
}
