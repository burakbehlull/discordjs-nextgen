import type { RESTClient } from '../rest/RESTClient.js';
import type { RawEmbed, RawInteraction, RawInteractionOption } from '../types/raw.js';
import { User } from './User.js';
import { Channel } from './Channel.js';
import { Message, type Member } from './Message.js';
import type { EmbedBuilder } from '../builders/EmbedBuilder.js';
import type { ActionRowBuilder } from '../builders/ButtonBuilder.js';
import type { Modal } from '../builders/ModalBuilder.js';
import type { PermissionName } from '../utils/Permission.js';

type MessageComponentLike = ActionRowBuilder | Record<string, unknown>;
type EmbedLike = EmbedBuilder | RawEmbed;

export interface InteractionReplyOptions {
  content?: string;
  embeds?: EmbedLike[];
  components?: MessageComponentLike[];
  ephemeral?: boolean;
}

export interface Entitlement {
  id: string;
  skuId: string;
  applicationId: string;
  userId?: string;
  guildId?: string;
  type: number;
  deleted: boolean;
  startsAt?: Date;
  endsAt?: Date;
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
  readonly targetId: string | null;
  readonly targetUser: User | null = null;
  readonly targetMessage: Message | null = null;
  readonly entitlements: Entitlement[] = [];
  private options: Map<string, string | number | boolean>;
  private focusedOption: { name: string; value: string | number | boolean } | null = null;
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

    // Parse options & focused option for autocomplete
    this.options = new Map();
    const findFocused = (opts?: RawInteractionOption[]): RawInteractionOption | null => {
      if (!opts) return null;
      for (const opt of opts) {
        if (opt.focused) return opt;
        if (opt.options) {
          const found = findFocused(opt.options);
          if (found) return found;
        }
      }
      return null;
    };

    const focused = findFocused(data.data?.options);
    if (focused) {
      this.focusedOption = {
        name: focused.name,
        value: focused.value ?? '',
      };
    }

    for (const opt of data.data?.options ?? []) {
      if (opt.value !== undefined) {
        this.options.set(opt.name, opt.value);
      }
    }

    // Parse values for selects
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

    // Parse Context Menu Target data
    this.targetId = data.data?.target_id ?? null;
    if (this.targetId && data.data?.resolved) {
      const resolved = data.data.resolved;
      if (resolved.users && resolved.users[this.targetId]) {
        this.targetUser = new User(resolved.users[this.targetId]);
      }
      if (resolved.messages && resolved.messages[this.targetId]) {
        this.targetMessage = new Message(resolved.messages[this.targetId], this.rest);
      }
    }

    // Parse Entitlements
    if (data.entitlements) {
      this.entitlements = data.entitlements.map((e: any) => ({
        id: e.id,
        skuId: e.sku_id,
        applicationId: e.application_id,
        userId: e.user_id,
        guildId: e.guild_id,
        type: e.type,
        deleted: e.deleted ?? false,
        startsAt: e.starts_at ? new Date(e.starts_at) : undefined,
        endsAt: e.ends_at ? new Date(e.ends_at) : undefined,
      }));
    }
  }

  get isCommand(): boolean {
    return this.type === 2;
  }

  get isAutocomplete(): boolean {
    return this.type === 4;
  }

  get commandType(): number {
    return (this._raw.data as any)?.type ?? 1;
  }

  get isSlashCommand(): boolean {
    return this.isCommand && this.commandType === 1;
  }

  get isUserContext(): boolean {
    return this.isCommand && this.commandType === 2;
  }

  get isMessageContext(): boolean {
    return this.isCommand && this.commandType === 3;
  }

  get isButton(): boolean {
    return this.type === 3 && this.componentType === 2;
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

  getFocused(withValue = false): any {
    if (!this.focusedOption) return null;
    return withValue ? this.focusedOption : this.focusedOption.value;
  }

  async respond(choices: Array<{ name: string; value: string | number }>): Promise<void> {
    if (this._replied) throw new Error('Interaction already replied');
    await this.rest.post(`/interactions/${this.id}/${this.token}/callback`, {
      type: 8, // APPLICATION_COMMAND_AUTOCOMPLETE_RESULT
      data: { choices },
    });
    this._replied = true;
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
