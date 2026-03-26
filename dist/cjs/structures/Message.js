"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Message = void 0;
const User_1 = require("./User");
const Channel_1 = require("./Channel");
class Message {
    constructor(data, rest) {
        this.id = data.id;
        this.channelId = data.channel_id;
        this.guildId = data.guild_id ?? null;
        this.author = new User_1.User(data.author);
        this.content = data.content;
        this.createdAt = new Date(data.timestamp);
        this.editedAt = data.edited_timestamp ? new Date(data.edited_timestamp) : null;
        this.pinned = data.pinned;
        this.type = data.type;
        this.member = data.member ? Message.parseMember(data.member) : null;
        this.rest = rest;
    }
    static parseMember(raw) {
        return {
            nick: raw.nick ?? null,
            roles: raw.roles,
            joinedAt: new Date(raw.joined_at),
            permissions: raw.permissions ?? null,
        };
    }
    get memberPermissions() {
        return this.member?.permissions ?? null;
    }
    get channel() {
        return new Channel_1.Channel({ id: this.channelId, type: 0, guild_id: this.guildId ?? undefined }, this.rest);
    }
    async reply(options) {
        const payload = typeof options === 'string'
            ? { content: options }
            : {
                content: options.content,
                embeds: options.embeds?.map((e) => e.toJSON()),
                components: options.components?.map((r) => r.toJSON()),
            };
        const data = await this.rest.post(`/channels/${this.channelId}/messages`, {
            ...payload,
            message_reference: { message_id: this.id },
        });
        return new Message(data, this.rest);
    }
    async edit(options) {
        const payload = typeof options === 'string'
            ? { content: options }
            : {
                content: options.content,
                embeds: options.embeds?.map((e) => e.toJSON()),
                components: options.components?.map((r) => r.toJSON()),
            };
        const data = await this.rest.patch(`/channels/${this.channelId}/messages/${this.id}`, payload);
        return new Message(data, this.rest);
    }
    async delete(reason) {
        await this.rest.delete(`/channels/${this.channelId}/messages/${this.id}`, reason);
    }
    async pin(reason) {
        await this.rest.request(`/channels/${this.channelId}/pins/${this.id}`, {
            method: 'PUT',
            reason,
        });
    }
    async unpin(reason) {
        await this.rest.delete(`/channels/${this.channelId}/pins/${this.id}`, reason);
    }
    async react(emoji) {
        await this.rest.request(`/channels/${this.channelId}/messages/${this.id}/reactions/${encodeURIComponent(emoji)}/@me`, { method: 'PUT' });
    }
    toString() {
        return this.content;
    }
}
exports.Message = Message;
//# sourceMappingURL=Message.js.map