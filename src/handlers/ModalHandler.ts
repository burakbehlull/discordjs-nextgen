import { Interaction } from '../structures/Interaction.js';
import { Context } from '../structures/Context.js';
import { Modal } from '../builders/ModalBuilder.js';
import { MiddlewareManager } from '../utils/MiddlewareManager.js';

export interface ModalHandlerOptions {}

export class ModalHandlerManager {
  readonly modals: Map<string, Modal> = new Map();
  readonly handlers: Array<{ customId: string | RegExp; run: (ctx: Context) => Promise<void> | void }> = [];

  constructor(public options: ModalHandlerOptions = {}) {}

  addModal(modal: Modal): void {
    this.modals.set(modal.customId, modal);
  }

  addHandler(customId: string | RegExp, run: (ctx: Context) => Promise<void> | void): void {
    this.handlers.push({ customId, run });
  }

  get(customId: string): Modal | undefined {
    return this.modals.get(customId);
  }

  async handle(interaction: Interaction, ctx: Context): Promise<boolean> {
    if (!interaction.isModalSubmit || !interaction.customId) return false;
    const customId = interaction.customId;

    // 1. Try registered Modal builder objects first
    const modal = this.modals.get(customId);
    if (modal) {
      const middlewareManager = new MiddlewareManager();
      for (const mw of modal.middleware) {
        middlewareManager.use(mw);
      }

      try {
        await middlewareManager.run(ctx, async () => {
          await modal.run(ctx);
        });
        return true;
      } catch (err) {
        throw err;
      }
    }

    // 2. Try dynamic callback handlers (string / RegExp customId matching)
    const handlerEntry = this.handlers.find((entry) => {
      if (typeof entry.customId === 'string') {
        return entry.customId === customId;
      }
      return entry.customId.test(customId);
    });

    if (handlerEntry) {
      try {
        await handlerEntry.run(ctx);
        return true;
      } catch (err) {
        throw err;
      }
    }

    return false;
  }
}
