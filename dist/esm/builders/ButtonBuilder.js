const styleMap = {
    primary: 1,
    secondary: 2,
    green: 3,
    red: 4,
    link: 5,
};
export class ButtonBuilder {
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
export class ActionRowBuilder {
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
//# sourceMappingURL=ButtonBuilder.js.map