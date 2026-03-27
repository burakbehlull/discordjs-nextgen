import type { Context } from '../structures/Context.js';

export type SelectType = 'string' | 'user' | 'role' | 'mentionable' | 'channel';

export interface SelectOption {
  label: string;
  value: string;
  description?: string;
  emoji?: { id?: string; name?: string; animated?: boolean };
  default?: boolean;
}

export interface SelectConfig {
  type?: SelectType;
}

export class Select {
  private static selects: Map<string, Select> = new Map();

  private readonly _customId: string;
  private readonly _type: SelectType;
  private _placeholder?: string;
  private _minValues?: number;
  private _maxValues?: number;
  private _options: SelectOption[] = [];
  private _channelTypes?: number[];
  private _disabled?: boolean;
  private _onSelect?: (ctx: Context) => Promise<void> | void;

  constructor(customId: string, config: SelectConfig = {}) {
    this._customId = customId;
    this._type = config.type ?? 'string';
    Select.selects.set(customId, this);
  }

  static create(customId: string, config: SelectConfig = {}): Select {
    return new Select(customId, config);
  }

  static get(customId: string): Select | undefined {
    return this.selects.get(customId);
  }

  placeholder(text: string): this {
    this._placeholder = text;
    return this;
  }

  min(value: number): this {
    this._minValues = value;
    return this;
  }

  max(value: number): this {
    this._maxValues = value;
    return this;
  }

  disabled(value = true): this {
    this._disabled = value;
    return this;
  }

  options(options: SelectOption[]): this {
    if (this._type !== 'string') {
      throw new Error(`Options can only be set for 'string' select menus, but current type is '${this._type}'.`);
    }
    this._options = options;
    return this;
  }

  channelTypes(types: number[]): this {
    if (this._type !== 'channel') {
      throw new Error(`Channel types can only be set for 'channel' select menus, but current type is '${this._type}'.`);
    }
    this._channelTypes = types;
    return this;
  }

  onSelect(callback: (ctx: Context) => Promise<void> | void): this {
    this._onSelect = callback;
    return this;
  }

  get customId(): string {
    return this._customId;
  }

  get type(): SelectType {
    return this._type;
  }

  get handler(): ((ctx: Context) => Promise<void> | void) | undefined {
    return this._onSelect;
  }

  toJSON(): any {
    const typeMap: Record<SelectType, number> = {
      string: 3,
      user: 5,
      role: 6,
      mentionable: 7,
      channel: 8,
    };

    const data: any = {
      type: typeMap[this._type],
      custom_id: this._customId,
      placeholder: this._placeholder,
      min_values: this._minValues,
      max_values: this._maxValues,
      disabled: this._disabled,
    };

    if (this._type === 'string') {
      data.options = this._options;
    }

    if (this._type === 'channel' && this._channelTypes) {
      data.channel_types = this._channelTypes;
    }

    return data;
  }

  build(): any {
    return {
      type: 1, // ActionRow
      components: [this.toJSON()],
    };
  }
}
