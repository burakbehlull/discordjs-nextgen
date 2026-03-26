"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Interaction = void 0;
const User_1 = require("./User");
class Interaction {
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
        this.user = new User_1.User(rawUser);
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
            data: ephemeral ? { flags: 64 } : {},
        });
        this._replied = true;
        this._deferred = true;
    }
    async editReply(options) {
        if (!this._replied)
            throw new Error('Interaction not yet replied');
        const payload = this.resolveOptions(options);
        await this.rest.patch(`/webhooks/${this.applicationId}/${this.token}/messages/@original`, payload);
    }
    async followUp(options) {
        const payload = this.resolveOptions(options);
        await this.rest.post(`/webhooks/${this.applicationId}/${this.token}`, payload);
    }
    resolveOptions(options) {
        if (typeof options === 'string')
            return { content: options };
        const payload = {};
        if (options.content)
            payload.content = options.content;
        if (options.embeds)
            payload.embeds = options.embeds.map((e) => e.toJSON());
        if (options.components)
            payload.components = options.components.map((r) => r.toJSON());
        if (options.ephemeral)
            payload.flags = 64;
        return payload;
    }
}
exports.Interaction = Interaction;
//# sourceMappingURL=Interaction.js.map