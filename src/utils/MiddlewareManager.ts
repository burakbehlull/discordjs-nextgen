import type { Context } from '../structures/Context.js';

export type MiddlewareFunction = (ctx: Context, next: () => Promise<void>) => Promise<void> | void;

export class MiddlewareManager {
  private middlewares: MiddlewareFunction[] = [];

  use(fn: MiddlewareFunction): void {
    this.middlewares.push(fn);
  }

  async run(ctx: Context, finalTask: () => Promise<void>): Promise<void> {
    let index = 0;

    const next = async (): Promise<void> => {
      if (index < this.middlewares.length) {
        const middleware = this.middlewares[index++];
        await middleware(ctx, next);
      } else {
        await finalTask();
      }
    };

    await next();
  }
}
