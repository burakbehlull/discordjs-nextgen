export type ButtonStyle = 'primary' | 'secondary' | 'green' | 'red' | 'link';

const styleMap: Record<ButtonStyle, number> = {
  primary:   1,
  secondary: 2,
  green:     3,
  red:       4,
  link:      5,
};

export class ButtonBuilder {
  private data: {
    type: 2;
    custom_id?: string;
    label?: string;
    style: number;
    url?: string;
    disabled?: boolean;
    emoji?: { name: string; id?: string; animated?: boolean };
  } = { type: 2, style: 1 };

  setCustomId(id: string): this {
    this.data.custom_id = id;
    return this;
  }

  setLabel(label: string): this {
    this.data.label = label;
    return this;
  }

  setStyle(style: ButtonStyle): this {
    this.data.style = styleMap[style];
    return this;
  }

  setURL(url: string): this {
    this.data.url = url;
    this.data.style = styleMap.link;
    return this;
  }

  setDisabled(disabled = true): this {
    this.data.disabled = disabled;
    return this;
  }

  setEmoji(name: string, id?: string, animated?: boolean): this {
    this.data.emoji = { name, id, animated };
    return this;
  }

  toJSON(): Record<string, unknown> {
    return { ...this.data };
  }
}

export class ActionRowBuilder {
  private buttons: ButtonBuilder[] = [];

  addButton(button: ButtonBuilder): this {
    if (this.buttons.length >= 5) {
      throw new Error('Bir ActionRow en fazla 5 buton içerebilir.');
    }
    this.buttons.push(button);
    return this;
  }

  toJSON(): Record<string, unknown> {
    return {
      type: 1,
      components: this.buttons.map((b) => b.toJSON()),
    };
  }
}
