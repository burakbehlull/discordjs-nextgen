import type { Context } from '../structures/Context.js';
export type MiddlewareFunction = (ctx: Context, next: () => Promise<void>) => Promise<void> | void;
export declare class MiddlewareManager {
    private middlewares;
    use(fn: MiddlewareFunction): void;
    run(ctx: Context, finalTask: () => Promise<void>): Promise<void>;
}
//# sourceMappingURL=MiddlewareManager.d.ts.map