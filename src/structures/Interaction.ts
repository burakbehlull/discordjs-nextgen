import type { RESTClient } from '../rest/RESTClient.js';
import type { RawEmbed, RawInteraction } from '../types/raw.js';
import { User } from './User.js';
import { Channel } from './Channel.js';
import type { EmbedBuilder } from '../builders/EmbedBuilder.js';
import type { ActionRowBuilder } from '../builders/ButtonBuilder.js';
import type { Modal } from '../builders/ModalBuilder.js';
import type { PermissionName } from '../utils/Permission.js';
import type { Member } from './Message.js';

type MessageComponentLike = ActionRowBuilder | Record<string, unknown>;
type EmbedLike = EmbedBuilder | RawEmbed;

export interface InteractionReplyOptions {
  content?: string;
  embeds?: EmbedLike[];
  components?: MessageComponentLike[];
  ephemeral?: boolean;
}

function serializeEmbedLike(embed: unknown): unknown {
  return typeof (embed as any)?.toJSON === 'function' ? (embed as any).toJSON() : embed;
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
  readonly memberPermissions: string | null;
  public values: Record<string, any> = {};
  public _usedPrefix: string | null = null;
  readonly member: Member | null;
  private options: Map<string, string | number | boolean>;
  private rest: RESTClient;
  private _replied = false;
  private _deferred = false;
  private _raw: RawInteraction;

  constructor(data: RawInteraction, rest: RESTClient) {
    this._raw = data;
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
    this.memberPermissions = data.member?.permissions ?? null;

    const rawUser = data.member?.user ?? data.user;
    if (!rawUser) throw new Error('Interaction has no user');
    this.user = new User(rawUser);
    this.member = data.member ? this.parseMember(data.member) : null;

    this.options = new Map();
    for (const opt of data.data?.options ?? []) {
      if (opt.value !== undefined) {
        this.options.set(opt.name, opt.value);
      }
    }

    if (data.data?.values && this.customId) {
      this.values[this.customId] = data.data.values.length === 1 ? data.data.values[0] : data.data.values;
    }

    if (data.data?.components) {
      for (const row of data.data.components) {
        if (!row.components) continue;
        for (const input of row.components as any[]) {
          if ('value' in input && input.custom_id) {
            this.values[input.custom_id] = input.value as string;
          }
        }
      }
    }
  }

  get isCommand(): boolean {
    return this.type === 2;
  }

  get isButton(): boolean {
    return this.type === 3;
  }

  get isModalSubmit(): boolean {
    return this.type === 5;
  }

  get isSelectMenu(): boolean {
    return this.type === 3 && [3, 5, 6, 7, 8].includes(this.componentType);
  }

  get componentType(): number {
    return (this._raw.data as any)?.component_type ?? 0;
  }

  get replied(): boolean {
    return this._replied;
  }

  get deferred(): boolean {
    return this._deferred;
  }

  get channel(): Channel | null {
    if (!this.channelId) return null;
    return new Channel({ id: this.channelId, type: 0, guild_id: this.guildId ?? undefined }, this.rest);
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

  get optionValues(): (string | number | boolean)[] {
    return Array.from(this.options.values());
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
      data: { flags: ephemeral ? 64 : 0 },
    });
    this._deferred = true;
    this._replied = true;
  }

  async showModal(modal: Modal | Record<string, any>): Promise<void> {
    if (this._replied) throw new Error('Interaction already replied');
    const payload = (typeof (modal as any).toJSON === 'function') ? (modal as any).toJSON() : modal;
    
    await this.rest.post(`/interactions/${this.id}/${this.token}/callback`, {
      type: 9, // MODAL
      data: payload,
    });
    this._replied = true;
  }

  async followUp(options: string | InteractionReplyOptions): Promise<void> {
    const payload = this.resolveOptions(options);
    await this.rest.post(`/webhooks/${this.applicationId}/${this.token}`, payload);
  }

  async editReply(options: string | InteractionReplyOptions): Promise<void> {
    const payload = this.resolveOptions(options);
    await this.rest.patch(`/webhooks/${this.applicationId}/${this.token}/messages/@original`, payload);
  }

  private resolveOptions(options: string | InteractionReplyOptions): any {
    if (typeof options === 'string') {
      return { content: options };
    }
    const { embeds, components, ephemeral, ...rest } = options;
    return {
      ...rest,
      embeds: embeds?.map((e) => serializeEmbedLike(e)),
      components: components?.map((c) =>
        typeof (c as any)?.toJSON === 'function' ? (c as any).toJSON() : c
      ),
      flags: ephemeral ? 64 : 0,
    };
  }

  private parseMember(raw: any): Member {
    return {
      nick: raw.nick ?? null,
      roles: raw.roles,
      joinedAt: new Date(raw.joined_at),
      permissions: raw.permissions ?? null,
    };
  }
}

