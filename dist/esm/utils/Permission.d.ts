export type PermissionName = 'CREATE_INSTANT_INVITE' | 'KICK_MEMBERS' | 'BAN_MEMBERS' | 'ADMINISTRATOR' | 'MANAGE_CHANNELS' | 'MANAGE_GUILD' | 'ADD_REACTIONS' | 'VIEW_AUDIT_LOG' | 'PRIORITY_SPEAKER' | 'STREAM' | 'VIEW_CHANNEL' | 'SEND_MESSAGES' | 'SEND_TTS_MESSAGES' | 'MANAGE_MESSAGES' | 'EMBED_LINKS' | 'ATTACH_FILES' | 'READ_MESSAGE_HISTORY' | 'MENTION_EVERYONE' | 'USE_EXTERNAL_EMOJIS' | 'VIEW_GUILD_INSIGHTS' | 'CONNECT' | 'SPEAK' | 'MUTE_MEMBERS' | 'DEAFEN_MEMBERS' | 'MOVE_MEMBERS' | 'USE_VAD' | 'CHANGE_NICKNAME' | 'MANAGE_NICKNAMES' | 'MANAGE_ROLES' | 'MANAGE_WEBHOOKS' | 'MANAGE_EMOJIS' | 'USE_SLASH_COMMANDS' | 'MODERATE_MEMBERS';
export declare class Permission {
    static has(permissionsValue: string, permission: PermissionName): boolean;
    static hasAny(permissionsValue: string, permissions: PermissionName[]): boolean;
    static hasAll(permissionsValue: string, permissions: PermissionName[]): boolean;
    static toNames(permissionsValue: string): PermissionName[];
}
//# sourceMappingURL=Permission.d.ts.map