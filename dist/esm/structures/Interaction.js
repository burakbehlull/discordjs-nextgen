import { User } from './User.js';
export class Interaction {
    constructor(data, rest) {
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
        const rawUser = data.member?.user ?? data.user;
        if (!rawUser)
            throw new Error('Interaction has no user');
        this.user = new User(rawUser);
        this.options = new Map();
        for (const opt of data.data?.options ?? []) {
            if (opt.value !== undefined) {
                this.options.set(opt.name, opt.value);
            }
        }
    }
    get isCommand() {
        return this.type === 2;
    }
    get isButton() {
        return this.type === 3;
    }
    get replied() {
        return this._replied;
    }
    get deferred() {
        return this._deferred;
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
    async followUp(options) {
        const payload = this.resolveOptions(options);
        await this.rest.post(`/webhooks/${this.applicationId}/${this.token}`, payload);
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
}
//# sourceMappingURL=Interaction.js.map