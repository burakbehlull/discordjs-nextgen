export class User {
    constructor(data) {
        this.id = data.id;
        this.username = data.username;
        this.discriminator = data.discriminator;
        this.globalName = data.global_name ?? null;
        this.avatar = data.avatar ?? null;
        this.bot = data.bot ?? false;
        this.system = data.system ?? false;
    }
    get tag() {
        return this.discriminator === '0'
            ? this.username
            : `${this.username}#${this.discriminator}`;
    }
    get displayName() {
        return this.globalName ?? this.username;
    }
    avatarURL(options = {}) {
        if (!this.avatar)
            return null;
        const { size = 128, format = 'png' } = options;
        return `https://cdn.discordapp.com/avatars/${this.id}/${this.avatar}.${format}?size=${size}`;
    }
    defaultAvatarURL() {
        const index = this.discriminator === '0'
            ? (Number(BigInt(this.id) >> 22n) % 6)
            : Number(this.discriminator) % 5;
        return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
    }
    toString() {
        return `<@${this.id}>`;
    }
    toJSON() {
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
//# sourceMappingURL=User.js.map