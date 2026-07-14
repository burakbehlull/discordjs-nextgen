export type SlashCommandOptionType =
  | 'string'
  | 'integer'
  | 'boolean'
  | 'user'
  | 'channel'
  | 'role'
  | 'mentionable'
  | 'number'
  | 'attachment';

const optionTypeMap: Record<SlashCommandOptionType, number> = {
  string: 3,
  integer: 4,
  boolean: 5,
  user: 6,
  channel: 7,
  role: 8,
  mentionable: 9,
  number: 10,
  attachment: 11,
};

export interface SlashCommandOption {
  name: string;
  description: string;
  type: SlashCommandOptionType;
  required?: boolean;
  choices?: Array<{ name: string; value: string | number }>;
  name_localizations?: Record<string, string>;
  description_localizations?: Record<string, string>;
  autocomplete?: boolean;
}

export class SlashCommandBuilder {
  private data: {
    name: string;
    description: string;
    options: unknown[];
    type: number;
    name_localizations?: Record<string, string>;
    description_localizations?: Record<string, string>;
  } = { name: '', description: '', options: [], type: 1 };

  setName(name: string): this {
    this.data.name = name;
    return this;
  }

  setDescription(description: string): this {
    this.data.description = description;
    return this;
  }

  setType(type: 1 | 2 | 3): this {
    this.data.type = type;
    return this;
  }

  setNameLocalizations(localizations: Record<string, string>): this {
    this.data.name_localizations = localizations;
    return this;
  }

  setDescriptionLocalizations(localizations: Record<string, string>): this {
    this.data.description_localizations = localizations;
    return this;
  }

  addOption(option: SlashCommandOption): this {
    const optObj: any = {
      name: option.name,
      description: option.description,
      type: optionTypeMap[option.type],
      required: option.required ?? false,
      choices: option.choices,
    };

    if (option.autocomplete !== undefined) {
      optObj.autocomplete = option.autocomplete;
    }
    if (option.name_localizations) {
      optObj.name_localizations = option.name_localizations;
    }
    if (option.description_localizations) {
      optObj.description_localizations = option.description_localizations;
    }

    this.data.options.push(optObj);
    return this;
  }

  copy(): SlashCommandBuilder {
    const builder = new SlashCommandBuilder();
    builder.data = {
      name: this.data.name,
      description: this.data.description,
      options: [...this.data.options],
      type: this.data.type,
      name_localizations: this.data.name_localizations ? { ...this.data.name_localizations } : undefined,
      description_localizations: this.data.description_localizations ? { ...this.data.description_localizations } : undefined,
    };
    return builder;
  }

  toJSON(): Record<string, unknown> {
    const json: Record<string, any> = {
      name: this.data.name,
      type: this.data.type,
    };

    if (this.data.name_localizations) {
      json.name_localizations = this.data.name_localizations;
    }

    // Context Menus (type 2/3) do not have description or options
    if (this.data.type === 1) {
      json.description = this.data.description;
      json.options = this.data.options;
      if (this.data.description_localizations) {
        json.description_localizations = this.data.description_localizations;
      }
    }

    return json;
  }
}
