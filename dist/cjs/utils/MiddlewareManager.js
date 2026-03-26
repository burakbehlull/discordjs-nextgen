"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MiddlewareManager = void 0;
class MiddlewareManager {
    constructor() {
        this.middlewares = [];
    }
    use(fn) {
        this.middlewares.push(fn);
    }
    async run(ctx, finalTask) {
        let index = 0;
        const next = async () => {
            if (index < this.middlewares.length) {
                const middleware = this.middlewares[index++];
                await middleware(ctx, next);
            }
            else {
                await finalTask();
            }
        };
        await next();
    }
}
exports.MiddlewareManager = MiddlewareManager;
//# sourceMappingURL=MiddlewareManager.js.map