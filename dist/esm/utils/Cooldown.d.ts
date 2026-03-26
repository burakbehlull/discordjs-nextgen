export declare class Cooldown {
    private readonly seconds;
    private readonly map;
    constructor(seconds: number);
    isOnCooldown(userId: string): boolean;
    remaining(userId: string): number;
    set(userId: string): void;
    clear(userId: string): void;
}
//# sourceMappingURL=Cooldown.d.ts.map