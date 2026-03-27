"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Modal = void 0;
class Modal {
    constructor(customId) {
        this._title = 'Modal';
        this._components = [];
        this._middleware = [];
        this.validationRules = new Map();
        this._customId = customId;
    }
    static create(customId) {
        return new Modal(customId);
    }
    get customId() {
        return this._customId;
    }
    get middleware() {
        return this._middleware;
    }
    title(title) {
        this._title = title;
        return this;
    }
    short(customId, options) {
        return this.addTextInput(customId, 1, options);
    }
    paragraph(customId, options) {
        return this.addTextInput(customId, 2, options);
    }
    addTextInput(customId, style, options) {
        this.validationRules.set(customId, options);
        const textInput = {
            type: 4,
            custom_id: customId,
            style,
            label: options.label,
            min_length: options.min,
            max_length: options.max,
            required: options.required ?? true,
            value: options.value,
            placeholder: options.placeholder,
        };
        this._components.push({
            type: 1, // ActionRow
            components: [textInput],
        });
        return this;
    }
    use(middleware) {
        this._middleware.push(middleware);
        return this;
    }
    onSubmit(callback) {
        this._onSubmit = callback;
        return this;
    }
    async run(ctx) {
        if (!this._onSubmit)
            return;
        // Automatic Validation
        const values = ctx.values;
        if (values) {
            for (const [key, value] of Object.entries(values)) {
                const rule = this.validationRules.get(key);
                if (rule) {
                    const valStr = String(value);
                    if (rule.min && valStr.length < rule.min) {
                        await ctx.reply({ content: `\`${rule.label}\` alanı en az ${rule.min} karakter olmalıdır.`, ephemeral: true });
                        return;
                    }
                    if (rule.max && valStr.length > rule.max) {
                        await ctx.reply({ content: `\`${rule.label}\` alanı en fazla ${rule.max} karakter olabilir.`, ephemeral: true });
                        return;
                    }
                }
            }
        }
        await this._onSubmit(ctx);
    }
    toJSON() {
        return {
            title: this._title,
            custom_id: this._customId,
            components: this._components,
        };
    }
}
exports.Modal = Modal;
//# sourceMappingURL=ModalBuilder.js.map