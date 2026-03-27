import { Interaction } from '../structures/Interaction.js';
import { Context } from '../structures/Context.js';
import { Modal } from '../builders/ModalBuilder.js';
import { MiddlewareManager } from '../utils/MiddlewareManager.js';

export interface ModalHandlerOptions {}

export class ModalHandlerManager {
  readonly modals: Map<string, Modal> = new Map();

  constructor(public options: ModalHandlerOptions = {}) {}

  addModal(modal: Modal): void {
    this.modals.set(modal.customId, modal);
  }

  get(customId: string): Modal | undefined {
    return this.modals.get(customId);
  }

  async handle(interaction: Interaction, ctx: Context): Promise<boolean> {
    if (!interaction.isModalSubmit || !interaction.customId) return false;

    const modal = this.modals.get(interaction.customId);
    if (!modal) return false;

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
}
