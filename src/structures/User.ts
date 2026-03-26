import type { RawUser } from '../types/raw';

export class User {
  readonly id: string;
  readonly username: string;
  readonly discriminator: string;
  readonly globalName: string | null;
  readonly avatar: string | null;
  readonly bot: boolean;
  readonly system: boolean;

  constructor(data: RawUser) {
    this.id = data.id;
    this.username = data.username;
    this.discriminator = data.discriminator;
    this.globalName = data.global_name ?? null;
    this.avatar = data.avatar ?? null;
    this.bot = data.bot ?? false;
    this.system = data.system ?? false;
  }

  get tag(): string {
    return this.discriminator === '0'
      ? this.username
      : `${this.username}#${this.discriminator}`;
  }

  get displayName(): string {
    return this.globalName ?? this.username;
  }

  avatarURL(options: { size?: 16 | 32 | 64 | 128 | 256 | 512 | 1024 | 2048; format?: 'png' | 'jpg' | 'webp' | 'gif' } = {}): string | null {
    if (!this.avatar) return null;
    const { size = 128, format = 'png' } = options;
    return `https://cdn.discordapp.com/avatars/${this.id}/${this.avatar}.${format}?size=${size}`;
  }

  defaultAvatarURL(): string {
    const index = this.discriminator === '0'
      ? (Number(BigInt(this.id) >> 22n) % 6)
      : Number(this.discriminator) % 5;
    return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
  }

  toString(): string {
    return `<@${this.id}>`;
  }

  toJSON(): RawUser {
    return {
      id: this.id,
      username: this.username,
      discriminator: this.discriminator,
      global_name: this.globalName ?? undefined,
      avatar: this.avatar ?? undefined,
      bot: this.bot,
      system: this.system,
    };
  }
}
