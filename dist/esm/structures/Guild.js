import { Channel } from './Channel';
import { User } from './User';
export class Guild {
    constructor(data, rest) {
        this.id = data.id;
        this.name = data.name;
        this.icon = data.icon ?? null;
        this.ownerId = data.owner_id;
        this.memberCount = data.member_count ?? 0;
        this.rest = rest;
        this.channels = new Map();
        for (const ch of data.channels ?? []) {
            this.channels.set(ch.id, new Channel(ch, rest));
        }
    }
    iconURL(options = {}) {
        if (!this.icon)
            return null;
        const { size = 128, format = 'png' } = options;
        return `https://cdn.discordapp.com/icons/${this.id}/${this.icon}.${format}?size=${size}`;
    }
    async fetchOwner() {
        const data = await this.rest.get(`/users/${this.ownerId}`);
        return new User(data);
    }
    async fetchMember(userId) {
        const data = await this.rest.get(`/guilds/${this.id}/members/${userId}`);
        return {
            user: new User(data.user),
            nick: data.nick ?? null,
            roles: data.roles,
        };
    }
    async ban(userId, options = {}) {
        await this.rest.request(`/guilds/${this.id}/bans/${userId}`, {
            method: 'PUT',
            body: { delete_message_days: options.deleteMessageDays ?? 0 },
            reason: options.reason,
        });
    }
    async unban(userId, reason) {
        await this.rest.delete(`/guilds/${this.id}/bans/${userId}`, reason);
    }
    async kick(userId, reason) {
        await this.rest.delete(`/guilds/${this.id}/members/${userId}`, reason);
    }
    async setNickname(userId, nick, reason) {
        await this.rest.patch(`/guilds/${this.id}/members/${userId}`, { nick }, reason);
    }
    async createChannel(options) {
        const { reason, ...rest } = options;
        const data = await this.rest.request(`/guilds/${this.id}/channels`, {
            method: 'POST',
            body: {
                name: rest.name,
                type: rest.type ?? 0,
                topic: rest.topic,
                parent_id: rest.parentId,
            },
            reason,
        });
        return new Channel(data, this.rest);
    }
    toString() {
        return this.name;
    }
}
//# sourceMappingURL=Guild.js.map