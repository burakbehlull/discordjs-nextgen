import type { RESTClient } from '../rest/RESTClient.js';
import type { RawEmbed, RawChannel } from '../types/raw.js';
import { EmbedBuilder } from '../builders/EmbedBuilder.js';
import type { ActionRowBuilder } from '../builders/ButtonBuilder.js';

export interface MessageSendOptions {
  content?: string;
  embeds?: EmbedBuilder[];
  components?: ActionRowBuilder[];
}

export class Channel {
  readonly id: string;
  readonly type: number;
  readonly guildId: string | null;
  readonly name: string | null;
  readonly topic: string | null;
  readonly nsfw: boolean;
  readonly lastMessageId: string | null;
  readonly position: number | null;
  readonly parentId: string | null;
  private rest: RESTClient;

  constructor(data: {
    id: string;
    type: number;
    guild_id?: string;
    name?: string;
    topic?: string;
    nsfw?: boolean;
    last_message_id?: string;
    position?: number;
    parent_id?: string;
  }, rest: RESTClient) {
    this.id = data.id;
    this.type = data.type;
    this.guildId = data.guild_id ?? null;
    this.name = data.name ?? null;
    this.topic = data.topic ?? null;
    this.nsfw = data.nsfw ?? false;
    this.lastMessageId = data.last_message_id ?? null;
    this.position = data.position ?? null;
    this.parentId = data.parent_id ?? null;
    this.rest = rest;
  }

  get isText(): boolean {
    return this.type === 0 || this.type === 11 || this.type === 12;
  }

  get isVoice(): boolean {
    return this.type === 2 || this.type === 13;
  }

  get isDM(): boolean {
    return this.type === 1 || this.type === 3;
  }

  async send(options: string | MessageSendOptions): Promise<unknown> {
    const payload = typeof options === 'string' ? { content: options } : this.resolveOptions(options);
    return this.rest.post(`/channels/${this.id}/messages`, payload);
  }

  private resolveOptions(options: MessageSendOptions): Record<string, unknown> {
    const payload: Record<string, unknown> = {};
    if (options.content) payload.content = options.content;
    if (options.embeds) {
      payload.embeds = options.embeds.map((e) => e.toJSON() as unknown as RawEmbed);
    }
    if (options.components) {
      payload.components = options.components.map((r) => r.toJSON());
    }
    return payload;
  }

  async bulkDelete(count: number): Promise<void> {
    const messages = await this.rest.get<Array<{ id: string }>>(
      `/channels/${this.id}/messages?limit=${Math.min(count, 100)}`
    );
    const ids = messages.map((m) => m.id);
    if (ids.length === 1) {
      await this.rest.delete(`/channels/${this.id}/messages/${ids[0]}`);
    } else if (ids.length > 1) {
      await this.rest.post(`/channels/${this.id}/messages/bulk-delete`, { messages: ids });
    }
  }

  async setTopic(topic: string, reason?: string): Promise<Channel> {
    const data = await this.rest.patch<RawChannel>(
      `/channels/${this.id}`,
      { topic },
      reason
    );
    return new Channel(data, this.rest);
  }

  toString(): string {
    return `<#${this.id}>`;
  }
}
