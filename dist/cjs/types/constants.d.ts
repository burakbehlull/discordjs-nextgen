export declare const API_BASE = "https://discord.com/api/v10";
export declare const GATEWAY_URL = "wss://gateway.discord.gg/?v=10&encoding=json";
export declare const GatewayOpcodes: {
    readonly DISPATCH: 0;
    readonly HEARTBEAT: 1;
    readonly IDENTIFY: 2;
    readonly PRESENCE_UPDATE: 3;
    readonly VOICE_STATE_UPDATE: 4;
    readonly RESUME: 6;
    readonly RECONNECT: 7;
    readonly REQUEST_GUILD_MEMBERS: 8;
    readonly INVALID_SESSION: 9;
    readonly HELLO: 10;
    readonly HEARTBEAT_ACK: 11;
};
export declare const GatewayEvents: {
    readonly READY: "READY";
    readonly MESSAGE_CREATE: "MESSAGE_CREATE";
    readonly MESSAGE_UPDATE: "MESSAGE_UPDATE";
    readonly MESSAGE_DELETE: "MESSAGE_DELETE";
    readonly GUILD_CREATE: "GUILD_CREATE";
    readonly GUILD_DELETE: "GUILD_DELETE";
    readonly GUILD_MEMBER_ADD: "GUILD_MEMBER_ADD";
    readonly GUILD_MEMBER_REMOVE: "GUILD_MEMBER_REMOVE";
    readonly INTERACTION_CREATE: "INTERACTION_CREATE";
    readonly CHANNEL_CREATE: "CHANNEL_CREATE";
    readonly CHANNEL_UPDATE: "CHANNEL_UPDATE";
    readonly CHANNEL_DELETE: "CHANNEL_DELETE";
};
export declare const Intents: {
    readonly GUILDS: number;
    readonly GUILD_MEMBERS: number;
    readonly GUILD_BANS: number;
    readonly GUILD_EMOJIS: number;
    readonly GUILD_INTEGRATIONS: number;
    readonly GUILD_WEBHOOKS: number;
    readonly GUILD_INVITES: number;
    readonly GUILD_VOICE_STATES: number;
    readonly GUILD_PRESENCES: number;
    readonly GUILD_MESSAGES: number;
    readonly GUILD_MESSAGE_REACTIONS: number;
    readonly GUILD_MESSAGE_TYPING: number;
    readonly DIRECT_MESSAGES: number;
    readonly DIRECT_MESSAGE_REACTIONS: number;
    readonly DIRECT_MESSAGE_TYPING: number;
    readonly MESSAGE_CONTENT: number;
    readonly ALL: 65535;
};
//# sourceMappingURL=constants.d.ts.map