export class Cooldown {
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
//# sourceMappingURL=Cooldown.js.map