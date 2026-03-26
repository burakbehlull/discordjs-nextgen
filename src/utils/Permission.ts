export type PermissionName =
  | 'CREATE_INSTANT_INVITE'
  | 'KICK_MEMBERS'
  | 'BAN_MEMBERS'
  | 'ADMINISTRATOR'
  | 'MANAGE_CHANNELS'
  | 'MANAGE_GUILD'
  | 'ADD_REACTIONS'
  | 'VIEW_AUDIT_LOG'
  | 'PRIORITY_SPEAKER'
  | 'STREAM'
  | 'VIEW_CHANNEL'
  | 'SEND_MESSAGES'
  | 'SEND_TTS_MESSAGES'
  | 'MANAGE_MESSAGES'
  | 'EMBED_LINKS'
  | 'ATTACH_FILES'
  | 'READ_MESSAGE_HISTORY'
  | 'MENTION_EVERYONE'
  | 'USE_EXTERNAL_EMOJIS'
  | 'VIEW_GUILD_INSIGHTS'
  | 'CONNECT'
  | 'SPEAK'
  | 'MUTE_MEMBERS'
  | 'DEAFEN_MEMBERS'
  | 'MOVE_MEMBERS'
  | 'USE_VAD'
  | 'CHANGE_NICKNAME'
  | 'MANAGE_NICKNAMES'
  | 'MANAGE_ROLES'
  | 'MANAGE_WEBHOOKS'
  | 'MANAGE_EMOJIS'
  | 'USE_SLASH_COMMANDS'
  | 'MODERATE_MEMBERS';

const PERMISSION_FLAGS: Record<PermissionName, bigint> = {
  CREATE_INSTANT_INVITE: 1n << 0n,
  KICK_MEMBERS:          1n << 1n,
  BAN_MEMBERS:           1n << 2n,
  ADMINISTRATOR:         1n << 3n,
  MANAGE_CHANNELS:       1n << 4n,
  MANAGE_GUILD:          1n << 5n,
  ADD_REACTIONS:         1n << 6n,
  VIEW_AUDIT_LOG:        1n << 7n,
  PRIORITY_SPEAKER:      1n << 8n,
  STREAM:                1n << 9n,
  VIEW_CHANNEL:          1n << 10n,
  SEND_MESSAGES:         1n << 11n,
  SEND_TTS_MESSAGES:     1n << 12n,
  MANAGE_MESSAGES:       1n << 13n,
  EMBED_LINKS:           1n << 14n,
  ATTACH_FILES:          1n << 15n,
  READ_MESSAGE_HISTORY:  1n << 16n,
  MENTION_EVERYONE:      1n << 17n,
  USE_EXTERNAL_EMOJIS:   1n << 18n,
  VIEW_GUILD_INSIGHTS:   1n << 19n,
  CONNECT:               1n << 20n,
  SPEAK:                 1n << 21n,
  MUTE_MEMBERS:          1n << 22n,
  DEAFEN_MEMBERS:        1n << 23n,
  MOVE_MEMBERS:          1n << 24n,
  USE_VAD:               1n << 25n,
  CHANGE_NICKNAME:       1n << 26n,
  MANAGE_NICKNAMES:      1n << 27n,
  MANAGE_ROLES:          1n << 28n,
  MANAGE_WEBHOOKS:       1n << 29n,
  MANAGE_EMOJIS:         1n << 30n,
  USE_SLASH_COMMANDS:    1n << 31n,
  MODERATE_MEMBERS:      1n << 40n,
};

export class Permission {
  static has(permissionsValue: string, permission: PermissionName): boolean {
    const bits = BigInt(permissionsValue);
    const flag = PERMISSION_FLAGS[permission];
    if (bits & PERMISSION_FLAGS.ADMINISTRATOR) return true;
    return (bits & flag) === flag;
  }

  static hasAny(permissionsValue: string, permissions: PermissionName[]): boolean {
    return permissions.some((p) => Permission.has(permissionsValue, p));
  }

  static hasAll(permissionsValue: string, permissions: PermissionName[]): boolean {
    return permissions.every((p) => Permission.has(permissionsValue, p));
  }

  static toNames(permissionsValue: string): PermissionName[] {
    const bits = BigInt(permissionsValue);
    return (Object.keys(PERMISSION_FLAGS) as PermissionName[]).filter(
      (key) => (bits & PERMISSION_FLAGS[key]) === PERMISSION_FLAGS[key]
    );
  }
}
