import type { RawEmbed } from '../types/raw';

export type EmbedField = { name: string; value: string; inline?: boolean };

export class EmbedBuilder {
  private data: Partial<RawEmbed> = {};

  setTitle(title: string): this {
    this.data.title = title;
    return this;
  }

  setDescription(description: string): this {
    this.data.description = description;
    return this;
  }

  setURL(url: string): this {
    this.data.url = url;
    return this;
  }

  setColor(color: number | `#${string}`): this {
    this.data.color =
      typeof color === 'string' ? parseInt(color.replace('#', ''), 16) : color;
    return this;
  }

  setTimestamp(timestamp?: Date | number): this {
    const d = timestamp instanceof Date ? timestamp : timestamp ? new Date(timestamp) : new Date();
    this.data.timestamp = d.toISOString();
    return this;
  }

  setFooter(text: string, iconURL?: string): this {
    this.data.footer = { text, icon_url: iconURL };
    return this;
  }

  setImage(url: string): this {
    this.data.image = { url };
    return this;
  }

  setThumbnail(url: string): this {
    this.data.thumbnail = { url };
    return this;
  }

  setAuthor(name: string, options?: { url?: string; iconURL?: string }): this {
    this.data.author = {
      name,
      url: options?.url,
      icon_url: options?.iconURL,
    };
    return this;
  }

  addField(name: string, value: string, inline = false): this {
    if (!this.data.fields) this.data.fields = [];
    this.data.fields.push({ name, value, inline });
    return this;
  }

  addFields(...fields: EmbedField[]): this {
    for (const field of fields) {
      this.addField(field.name, field.value, field.inline);
    }
    return this;
  }

  toJSON(): RawEmbed {
    return { ...this.data } as RawEmbed;
  }
}
