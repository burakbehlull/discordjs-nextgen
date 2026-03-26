"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cooldown = void 0;
exports.cooldown = cooldown;
class Cooldown {
    constructor(seconds) {
        this.map = new Map();
        this.seconds = seconds;
    }
    isOnCooldown(userId) {
        const expires = this.map.get(userId);
        if (!expires)
            return false;
        if (Date.now() >= expires) {
            this.map.delete(userId);
            return false;
        }
        return true;
    }
    remaining(userId) {
        const expires = this.map.get(userId);
        if (!expires)
            return 0;
        return Math.ceil((expires - Date.now()) / 1000);
    }
    set(userId) {
        this.map.set(userId, Date.now() + this.seconds * 1000);
    }
    clear(userId) {
        this.map.delete(userId);
    }
}
exports.Cooldown = Cooldown;
function cooldown(seconds) {
    const cooldownInstance = new Cooldown(seconds);
    return async (ctx, next) => {
        const userId = ctx.user.id;
        if (cooldownInstance.isOnCooldown(userId)) {
            const remaining = cooldownInstance.remaining(userId);
            await ctx.reply(`Lutfen bekle! **${remaining}s** sonra tekrar dene.`).catch(() => null);
            return;
        }
        cooldownInstance.set(userId);
        await next();
    };
}
//# sourceMappingURL=Cooldown.js.map