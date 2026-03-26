export interface RawUser {
    id: string;
    username: string;
    discriminator: string;
    global_name?: string;
    avatar?: string;
    bot?: boolean;
    system?: boolean;
}
export interface RawChannel {
    id: string;
    type: number;
    guild_id?: string;
    name?: string;
    topic?: string;
    nsfw?: boolean;
    last_message_id?: string;
    position?: number;
    parent_id?: string;
}
export interface RawGuild {
    id: string;
    name: string;
    icon?: string;
    owner_id: string;
    member_count?: number;
    channels?: RawChannel[];
    members?: RawMember[];
}
export interface RawMember {
    user?: RawUser;
    nick?: string;
    roles: string[];
    joined_at: string;
    permissions?: string;
}
export interface RawComponent {
    type: number;
    components?: RawButtonComponent[];
}
export interface RawButtonComponent {
    type: 2;
    custom_id?: string;
    label?: string;
    style: number;
    url?: string;
    disabled?: boolean;
}
export interface RawMessage {
    id: string;
    channel_id: string;
    guild_id?: string;
    author: RawUser;
    content: string;
    timestamp: string;
    edited_timestamp?: string;
    attachments: RawAttachment[];
    embeds: RawEmbed[];
    mentions: RawUser[];
    mention_everyone: boolean;
    pinned: boolean;
    type: number;
    member?: RawMember;
}
export interface RawAttachment {
    id: string;
    filename: string;
    size: number;
    url: string;
    proxy_url: string;
    height?: number;
    width?: number;
}
export interface RawEmbed {
    title?: string;
    description?: string;
    url?: string;
    color?: number;
    timestamp?: string;
    footer?: {
        text: string;
        icon_url?: string;
    };
    image?: {
        url: string;
    };
    thumbnail?: {
        url: string;
    };
    author?: {
        name: string;
        url?: string;
        icon_url?: string;
    };
    fields?: Array<{
        name: string;
        value: string;
        inline?: boolean;
    }>;
}
export interface RawInteraction {
    id: string;
    application_id: string;
    type: number;
    data?: RawInteractionData;
    guild_id?: string;
    channel_id?: string;
    member?: RawMember;
    user?: RawUser;
    token: string;
    version: number;
}
export interface RawInteractionData {
    id: string;
    name: string;
    type: number;
    custom_id?: string;
    options?: RawInteractionOption[];
}
export interface RawInteractionOption {
    name: string;
    type: number;
    value?: string | number | boolean;
    options?: RawInteractionOption[];
}
export type ActivityType = 0 | 1 | 2 | 3 | 4 | 5;
export interface PresenceData {
    status?: 'online' | 'idle' | 'dnd' | 'invisible';
    activities?: Array<{
        name: string;
        type: ActivityType;
        url?: string;
    }>;
    afk?: boolean;
}
//# sourceMappingURL=raw.d.ts.map