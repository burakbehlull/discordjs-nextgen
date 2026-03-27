import { User } from './User.js';
import { Channel } from './Channel.js';
export class Message {
    constructor(data, rest) {
        this._usedPrefix = null;
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
        return new Channel({ id: this.channelId, type: 0, guild_id: this.guildId ?? undefined }, this.rest);
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
    toString() {
        return this.content;
    }
}
//# sourceMappingURL=Message.js.map