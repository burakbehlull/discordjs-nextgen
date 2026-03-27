import { User } from './User.js';
import { Channel } from './Channel.js';
export class Interaction {
    constructor(data, rest) {
        this.values = {};
        this._usedPrefix = null;
        this._replied = false;
        this._deferred = false;
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
        if (!rawUser)
            throw new Error('Interaction has no user');
        this.user = new User(rawUser);
        this.member = data.member ? this.parseMember(data.member) : null;
        this.options = new Map();
        for (const opt of data.data?.options ?? []) {
            if (opt.value !== undefined) {
                this.options.set(opt.name, opt.value);
            }
        }
        if (data.data?.components) {
            for (const row of data.data.components) {
                if (!row.components)
                    continue;
                for (const input of row.components) {
                    if ('value' in input && input.custom_id) {
                        this.values[input.custom_id] = input.value;
                    }
                }
            }
        }
    }
    get isCommand() {
        return this.type === 2;
    }
    get isButton() {
        return this.type === 3;
    }
    get isModalSubmit() {
        return this.type === 5;
    }
    get replied() {
        return this._replied;
    }
    get deferred() {
        return this._deferred;
    }
    get channel() {
        if (!this.channelId)
            return null;
        return new Channel({ id: this.channelId, type: 0, guild_id: this.guildId ?? undefined }, this.rest);
    }
    getString(name) {
        return this.options.get(name) ?? null;
    }
    getInteger(name) {
        return this.options.get(name) ?? null;
    }
    getBoolean(name) {
        const val = this.options.get(name);
        return val === undefined ? null : val;
    }
    get optionValues() {
        return Array.from(this.options.values());
    }
    async reply(options) {
        if (this._replied)
            throw new Error('Interaction already replied');
        const payload = this.resolveOptions(options);
        await this.rest.post(`/interactions/${this.id}/${this.token}/callback`, {
            type: 4,
            data: payload,
        });
        this._replied = true;
    }
    async deferReply(ephemeral = false) {
        if (this._replied)
            throw new Error('Interaction already replied');
        await this.rest.post(`/interactions/${this.id}/${this.token}/callback`, {
            type: 5,
            data: { flags: ephemeral ? 64 : 0 },
        });
        this._deferred = true;
        this._replied = true;
    }
    async showModal(modal) {
        if (this._replied)
            throw new Error('Interaction already replied');
        const payload = (typeof modal.toJSON === 'function') ? modal.toJSON() : modal;
        await this.rest.post(`/interactions/${this.id}/${this.token}/callback`, {
            type: 9, // MODAL
            data: payload,
        });
        this._replied = true;
    }
    async followUp(options) {
        const payload = this.resolveOptions(options);
        await this.rest.post(`/webhooks/${this.applicationId}/${this.token}`, payload);
    }
    async editReply(options) {
        const payload = this.resolveOptions(options);
        await this.rest.patch(`/webhooks/${this.applicationId}/${this.token}/messages/@original`, payload);
    }
    resolveOptions(options) {
        if (typeof options === 'string') {
            return { content: options };
        }
        const { embeds, components, ephemeral, ...rest } = options;
        return {
            ...rest,
            embeds: embeds?.map((e) => e.toJSON()),
            components: components?.map((c) => c.toJSON()),
            flags: ephemeral ? 64 : 0,
        };
    }
    parseMember(raw) {
        return {
            nick: raw.nick ?? null,
            roles: raw.roles,
            joinedAt: new Date(raw.joined_at),
            permissions: raw.permissions ?? null,
        };
    }
}
//# sourceMappingURL=Interaction.js.map