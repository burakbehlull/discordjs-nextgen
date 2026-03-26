"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Intents = exports.GatewayEvents = exports.GatewayOpcodes = exports.GATEWAY_URL = exports.API_BASE = void 0;
exports.API_BASE = 'https://discord.com/api/v10';
exports.GATEWAY_URL = 'wss://gateway.discord.gg/?v=10&encoding=json';
exports.GatewayOpcodes = {
    DISPATCH: 0,
    HEARTBEAT: 1,
    IDENTIFY: 2,
    PRESENCE_UPDATE: 3,
    VOICE_STATE_UPDATE: 4,
    RESUME: 6,
    RECONNECT: 7,
    REQUEST_GUILD_MEMBERS: 8,
    INVALID_SESSION: 9,
    HELLO: 10,
    HEARTBEAT_ACK: 11,
};
exports.GatewayEvents = {
    READY: 'READY',
    MESSAGE_CREATE: 'MESSAGE_CREATE',
    MESSAGE_UPDATE: 'MESSAGE_UPDATE',
    MESSAGE_DELETE: 'MESSAGE_DELETE',
    GUILD_CREATE: 'GUILD_CREATE',
    GUILD_DELETE: 'GUILD_DELETE',
    GUILD_MEMBER_ADD: 'GUILD_MEMBER_ADD',
    GUILD_MEMBER_REMOVE: 'GUILD_MEMBER_REMOVE',
    INTERACTION_CREATE: 'INTERACTION_CREATE',
    CHANNEL_CREATE: 'CHANNEL_CREATE',
    CHANNEL_UPDATE: 'CHANNEL_UPDATE',
    CHANNEL_DELETE: 'CHANNEL_DELETE',
};
exports.Intents = {
    GUILDS: 1 << 0,
    GUILD_MEMBERS: 1 << 1,
    GUILD_BANS: 1 << 2,
    GUILD_EMOJIS: 1 << 3,
    GUILD_INTEGRATIONS: 1 << 4,
    GUILD_WEBHOOKS: 1 << 5,
    GUILD_INVITES: 1 << 6,
    GUILD_VOICE_STATES: 1 << 7,
    GUILD_PRESENCES: 1 << 8,
    GUILD_MESSAGES: 1 << 9,
    GUILD_MESSAGE_REACTIONS: 1 << 10,
    GUILD_MESSAGE_TYPING: 1 << 11,
    DIRECT_MESSAGES: 1 << 12,
    DIRECT_MESSAGE_REACTIONS: 1 << 13,
    DIRECT_MESSAGE_TYPING: 1 << 14,
    MESSAGE_CONTENT: 1 << 15,
    ALL: 0b1111111111111111,
};
//# sourceMappingURL=constants.js.map