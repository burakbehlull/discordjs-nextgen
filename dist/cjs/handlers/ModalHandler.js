"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModalHandlerManager = void 0;
const MiddlewareManager_js_1 = require("../utils/MiddlewareManager.js");
class ModalHandlerManager {
    constructor(options = {}) {
        this.options = options;
        this.modals = new Map();
    }
    addModal(modal) {
        this.modals.set(modal.customId, modal);
    }
    get(customId) {
        return this.modals.get(customId);
    }
    async handle(interaction, ctx) {
        if (!interaction.isModalSubmit || !interaction.customId)
            return false;
        const modal = this.modals.get(interaction.customId);
        if (!modal)
            return false;
        const middlewareManager = new MiddlewareManager_js_1.MiddlewareManager();
        for (const mw of modal.middleware) {
            middlewareManager.use(mw);
        }
        try {
            await middlewareManager.run(ctx, async () => {
                await modal.run(ctx);
            });
            return true;
        }
        catch (err) {
            throw err;
        }
    }
}
exports.ModalHandlerManager = ModalHandlerManager;
//# sourceMappingURL=ModalHandler.js.map