import type { RESTClient } from '../rest/RESTClient';
import type { RawInteraction } from '../types/raw';
import { User } from './User';
import type { EmbedBuilder } from '../builders/EmbedBuilder';
import type { ActionRowBuilder } from '../builders/ButtonBuilder';

export interface InteractionReplyOptions {
  content?: string;
  embeds?: EmbedBuilder[];
  components?: ActionRowBuilder[];
  ephemeral?: boolean;
}

export class Interaction {
  readonly id: string;
  readonly applicationId: string;
  readonly type: number;
  readonly guildId: string | null;
  readonly channelId: string | null;
  readonly token: string;
  readonly commandName: string | null;
  readonly customId: string | null;
  readonly user: User;
  readonly createdAt: Date;
  private options: Map<string, string | number | boolean>;
  private rest: RESTClient;
  private _replied = false;
  private _deferred = false;

  constructor(data: RawInteraction, rest: RESTClient) {
    this.id = data.id;
    this.applicationId = data.application_id;
    this.type = data.type;
    this.guildId = data.guild_id ?? null;
    this.channelId = data.channel_id ?? null;
    this.token = data.token;
    this.commandName = data.data?.name ?? null;
    this.customId = data.data?.custom_id ?? null;
    this.rest = rest;
    this.createdAt = new Date(Number((BigInt(this.id) >> 22n) + 1420070400000n));

    const rawUser = data.member?.user ?? data.user;
    if (!rawUser) throw new Error('Interaction has no user');
    this.user = new User(rawUser);

    this.options = new Map();
    for (const opt of data.data?.options ?? []) {
      if (opt.value !== undefined) {
        this.options.set(opt.name, opt.value);
      }
    }
  }

  get isCommand(): boolean {
    return this.type === 2;
  }

  get isButton(): boolean {
    return this.type === 3;
  }

  get replied(): boolean {
    return this._replied;
  }

  get deferred(): boolean {
    return this._deferred;
  }

  getString(name: string): string | null {
    return (this.options.get(name) as string) ?? null;
  }

  getInteger(name: string): number | null {
    return (this.options.get(name) as number) ?? null;
  }

  getBoolean(name: string): boolean | null {
    const val = this.options.get(name);
    return val === undefined ? null : (val as boolean);
  }

  async reply(options: string | InteractionReplyOptions): Promise<void> {
    if (this._replied) throw new Error('Interaction already replied');
    const payload = this.resolveOptions(options);
    await this.rest.post(`/interactions/${this.id}/${this.token}/callback`, {
      type: 4,
      data: payload,
    });
    this._replied = true;
  }

  async deferReply(ephemeral = false): Promise<void> {
    if (this._replied) throw new Error('Interaction already replied');
    await this.rest.post(`/interactions/${this.id}/${this.token}/callback`, {
      type: 5,
      data: ephemeral ? { flags: 64 } : {},
    });
    this._replied = true;
    this._deferred = true;
  }

  async editReply(options: string | InteractionReplyOptions): Promise<void> {
    if (!this._replied) throw new Error('Interaction not yet replied');
    const payload = this.resolveOptions(options);
    await this.rest.patch(
      `/webhooks/${this.applicationId}/${this.token}/messages/@original`,
      payload as Record<string, unknown>
    );
  }

  async followUp(options: string | InteractionReplyOptions): Promise<void> {
    const payload = this.resolveOptions(options);
    await this.rest.post(
      `/webhooks/${this.applicationId}/${this.token}`,
      payload as Record<string, unknown>
    );
  }

  private resolveOptions(options: string | InteractionReplyOptions): Record<string, unknown> {
    if (typeof options === 'string') return { content: options };
    const payload: Record<string, unknown> = {};
    if (options.content) payload.content = options.content;
    if (options.embeds) payload.embeds = options.embeds.map((e) => e.toJSON());
    if (options.components) payload.components = options.components.map((r) => r.toJSON());
    if (options.ephemeral) payload.flags = 64;
    return payload;
  }
}
