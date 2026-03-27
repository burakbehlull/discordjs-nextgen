import { Interaction } from '../structures/Interaction.js';
import { Context } from '../structures/Context.js';
import { Modal } from '../builders/ModalBuilder.js';
export interface ModalHandlerOptions {
}
export declare class ModalHandlerManager {
    options: ModalHandlerOptions;
    readonly modals: Map<string, Modal>;
    constructor(options?: ModalHandlerOptions);
    addModal(modal: Modal): void;
    get(customId: string): Modal | undefined;
    handle(interaction: Interaction, ctx: Context): Promise<boolean>;
}
//# sourceMappingURL=ModalHandler.d.ts.map