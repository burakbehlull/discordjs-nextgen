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

  static create(id?: string): ButtonBuilder {
    const builder = new ButtonBuilder();
    if (id) builder.setCustomId(id);
    return builder;
  }

  setCustomId(id: string): this {
    this.data.custom_id = id;
    return this;
  }

  setLabel(label: string): this {
    this.data.label = label;
    return this;
  }

  setStyle(style: ButtonStyle | string): this {
    const s = style.toLowerCase() as ButtonStyle;
    const mapped = styleMap[s];
    if (mapped === undefined) {
      throw new Error(`Geçersiz buton stili: ${style}. Geçerli stiller: ${Object.keys(styleMap).join(', ')}`);
    }
    this.data.style = mapped;
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
  private components: (ButtonBuilder | any)[] = [];

  addComponents(...components: (ButtonBuilder | any)[]): this {
    for (const component of components) {
      if (this.components.length >= 5) {
        throw new Error('Bir ActionRow en fazla 5 bileşen içerebilir.');
      }
      this.components.push(component);
    }
    return this;
  }

  addButton(button: ButtonBuilder): this {
    return this.addComponents(button);
  }

  toJSON(): Record<string, unknown> {
    return {
      type: 1,
      components: this.components.map((c) => (c.toJSON ? c.toJSON() : c)),
    };
  }

  static create(...components: (ButtonBuilder | any)[]): ActionRowBuilder {
    return new ActionRowBuilder().addComponents(...components);
  }
}
