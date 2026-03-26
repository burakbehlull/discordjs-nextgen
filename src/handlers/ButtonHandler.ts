import { Context } from '../structures/Context.js';
import type { Interaction } from '../structures/Interaction.js';

export interface ButtonHandler {
  customId: string | RegExp;
  run: (ctx: Context) => Promise<void> | void;
}

export interface ButtonHandlerOptions {
  buttons?: ButtonHandler[];
}

export class ButtonHandlerManager {
  readonly buttons: ButtonHandler[] = [];

  constructor(options: Partial<ButtonHandlerOptions> = {}) {
    for (const button of options.buttons ?? []) {
      this.addButton(button);
    }
  }

  addButton(button: ButtonHandler): void {
    this.buttons.push(button);
  }

  addButtons(buttons: ButtonHandler[]): void {
    for (const button of buttons) {
      this.addButton(button);
    }
  }

  async handle(interaction: Interaction): Promise<boolean> {
    if (!interaction.isButton || !interaction.customId) return false;
    const customId = interaction.customId;

    const button = this.buttons.find((entry) => {
      if (typeof entry.customId === 'string') {
        return entry.customId === customId;
      }

      return entry.customId.test(customId);
    });

    if (!button) return false;

    const ctx = new Context(interaction);

    try {
      await button.run(ctx);
      return true;
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      const message = `Buton calistirilirken hata olustu: \`${error}\``;

      if (!interaction.replied && !interaction.deferred) {
        await ctx.reply({ content: message, ephemeral: true }).catch(() => null);
      } else {
        await interaction.followUp({ content: message, ephemeral: true }).catch(() => null);
      }

      return true;
    }
  }
}
