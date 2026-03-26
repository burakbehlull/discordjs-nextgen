import { Context } from '../structures/Context.js';
export class ButtonHandlerManager {
    constructor(options = {}) {
        this.buttons = [];
        for (const button of options.buttons ?? []) {
            this.addButton(button);
        }
    }
    addButton(button) {
        this.buttons.push(button);
    }
    addButtons(buttons) {
        for (const button of buttons) {
            this.addButton(button);
        }
    }
    async handle(interaction) {
        if (!interaction.isButton || !interaction.customId)
            return false;
        const customId = interaction.customId;
        const button = this.buttons.find((entry) => {
            if (typeof entry.customId === 'string') {
                return entry.customId === customId;
            }
            return entry.customId.test(customId);
        });
        if (!button)
            return false;
        const ctx = new Context(interaction);
        try {
            await button.run(ctx);
            return true;
        }
        catch (err) {
            const error = err instanceof Error ? err.message : String(err);
            const message = `Buton calistirilirken hata olustu: \`${error}\``;
            if (!interaction.replied && !interaction.deferred) {
                await ctx.reply({ content: message, ephemeral: true }).catch(() => null);
            }
            else {
                await interaction.followUp({ content: message, ephemeral: true }).catch(() => null);
            }
            return true;
        }
    }
}
//# sourceMappingURL=ButtonHandler.js.map