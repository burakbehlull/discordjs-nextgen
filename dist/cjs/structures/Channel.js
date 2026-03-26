"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Channel = void 0;
class Channel {
    constructor(data, rest) {
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
    get isText() {
        return this.type === 0 || this.type === 11 || this.type === 12;
    }
    get isVoice() {
        return this.type === 2 || this.type === 13;
    }
    get isDM() {
        return this.type === 1 || this.type === 3;
    }
    async send(options) {
        const payload = typeof options === 'string' ? { content: options } : this.resolveOptions(options);
        return this.rest.post(`/channels/${this.id}/messages`, payload);
    }
    resolveOptions(options) {
        const payload = {};
        if (options.content)
            payload.content = options.content;
        if (options.embeds) {
            payload.embeds = options.embeds.map((e) => e.toJSON());
        }
        if (options.components) {
            payload.components = options.components.map((r) => r.toJSON());
        }
        return payload;
    }
    async bulkDelete(count) {
        const messages = await this.rest.get(`/channels/${this.id}/messages?limit=${Math.min(count, 100)}`);
        const ids = messages.map((m) => m.id);
        if (ids.length === 1) {
            await this.rest.delete(`/channels/${this.id}/messages/${ids[0]}`);
        }
        else if (ids.length > 1) {
            await this.rest.post(`/channels/${this.id}/messages/bulk-delete`, { messages: ids });
        }
    }
    async setTopic(topic, reason) {
        const data = await this.rest.patch(`/channels/${this.id}`, { topic }, reason);
        return new Channel(data, this.rest);
    }
    toString() {
        return `<#${this.id}>`;
    }
}
exports.Channel = Channel;
//# sourceMappingURL=Channel.js.map