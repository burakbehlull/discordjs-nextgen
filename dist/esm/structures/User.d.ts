import type { RawUser } from '../types/raw.js';
export declare class User {
    readonly id: string;
    readonly username: string;
    readonly discriminator: string;
    readonly globalName: string | null;
    readonly avatar: string | null;
    readonly bot: boolean;
    readonly system: boolean;
    constructor(data: RawUser);
    get tag(): string;
    get displayName(): string;
    avatarURL(options?: {
        size?: 16 | 32 | 64 | 128 | 256 | 512 | 1024 | 2048;
        format?: 'png' | 'jpg' | 'webp' | 'gif';
    }): string | null;
    defaultAvatarURL(): string;
    toString(): string;
    toJSON(): RawUser;
}
//# sourceMappingURL=User.d.ts.map