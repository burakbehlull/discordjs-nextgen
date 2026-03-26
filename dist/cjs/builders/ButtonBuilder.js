"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionRowBuilder = exports.ButtonBuilder = void 0;
const styleMap = {
    primary: 1,
    secondary: 2,
    green: 3,
    red: 4,
    link: 5,
};
class ButtonBuilder {
    constructor() {
        this.data = { type: 2, style: 1 };
    }
    setCustomId(id) {
        this.data.custom_id = id;
        return this;
    }
    setLabel(label) {
        this.data.label = label;
        return this;
    }
    setStyle(style) {
        this.data.style = styleMap[style];
        return this;
    }
    setURL(url) {
        this.data.url = url;
        this.data.style = styleMap.link;
        return this;
    }
    setDisabled(disabled = true) {
        this.data.disabled = disabled;
        return this;
    }
    setEmoji(name, id, animated) {
        this.data.emoji = { name, id, animated };
        return this;
    }
    toJSON() {
        return { ...this.data };
    }
}
exports.ButtonBuilder = ButtonBuilder;
class ActionRowBuilder {
    constructor() {
        this.buttons = [];
    }
    addButton(button) {
        if (this.buttons.length >= 5) {
            throw new Error('Bir ActionRow en fazla 5 buton içerebilir.');
        }
        this.buttons.push(button);
        return this;
    }
    toJSON() {
        return {
            type: 1,
            components: this.buttons.map((b) => b.toJSON()),
        };
    }
}
exports.ActionRowBuilder = ActionRowBuilder;
//# sourceMappingURL=ButtonBuilder.js.map