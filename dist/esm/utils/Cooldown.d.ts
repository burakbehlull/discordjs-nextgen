export declare class Cooldown {
    private readonly seconds;
    private readonly map;
    constructor(seconds: number);
    isOnCooldown(userId: string): boolean;
    remaining(userId: string): number;
    set(userId: string): void;
    clear(userId: string): void;
}
import type { MiddlewareFunction } from './MiddlewareManager.js';
export declare function cooldown(seconds: number): MiddlewareFunction;
//# sourceMappingURL=Cooldown.d.ts.map