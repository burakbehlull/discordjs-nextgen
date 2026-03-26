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
}

export class SlashCommandBuilder {
  private data: {
    name: string;
    description: string;
    options: unknown[];
  } = { name: '', description: '', options: [] };

  setName(name: string): this {
    this.data.name = name;
    return this;
  }

  setDescription(description: string): this {
    this.data.description = description;
    return this;
  }

  addOption(option: SlashCommandOption): this {
    this.data.options.push({
      name: option.name,
      description: option.description,
      type: optionTypeMap[option.type],
      required: option.required ?? false,
      choices: option.choices,
    });
    return this;
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.data.name,
      description: this.data.description,
      options: this.data.options,
      type: 1,
    };
  }
}
