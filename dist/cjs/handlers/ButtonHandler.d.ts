import { Context } from '../structures/Context.js';
import type { Interaction } from '../structures/Interaction.js';
export interface ButtonHandler {
    customId: string | RegExp;
    run: (ctx: Context) => Promise<void> | void;
}
export interface ButtonHandlerOptions {
    buttons?: ButtonHandler[];
}
export declare class ButtonHandlerManager {
    readonly buttons: ButtonHandler[];
    constructor(options?: Partial<ButtonHandlerOptions>);
    addButton(button: ButtonHandler): void;
    addButtons(buttons: ButtonHandler[]): void;
    handle(interaction: Interaction): Promise<boolean>;
}
//# sourceMappingURL=ButtonHandler.d.ts.map