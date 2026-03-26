"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmbedBuilder = void 0;
class EmbedBuilder {
    constructor() {
        this.data = {};
    }
    setTitle(title) {
        this.data.title = title;
        return this;
    }
    setDescription(description) {
        this.data.description = description;
        return this;
    }
    setURL(url) {
        this.data.url = url;
        return this;
    }
    setColor(color) {
        this.data.color =
            typeof color === 'string' ? parseInt(color.replace('#', ''), 16) : color;
        return this;
    }
    setTimestamp(timestamp) {
        const d = timestamp instanceof Date ? timestamp : timestamp ? new Date(timestamp) : new Date();
        this.data.timestamp = d.toISOString();
        return this;
    }
    setFooter(text, iconURL) {
        this.data.footer = { text, icon_url: iconURL };
        return this;
    }
    setImage(url) {
        this.data.image = { url };
        return this;
    }
    setThumbnail(url) {
        this.data.thumbnail = { url };
        return this;
    }
    setAuthor(name, options) {
        this.data.author = {
            name,
            url: options?.url,
            icon_url: options?.iconURL,
        };
        return this;
    }
    addField(name, value, inline = false) {
        if (!this.data.fields)
            this.data.fields = [];
        this.data.fields.push({ name, value, inline });
        return this;
    }
    addFields(...fields) {
        for (const field of fields) {
            this.addField(field.name, field.value, field.inline);
        }
        return this;
    }
    toJSON() {
        return { ...this.data };
    }
}
exports.EmbedBuilder = EmbedBuilder;
//# sourceMappingURL=EmbedBuilder.js.map