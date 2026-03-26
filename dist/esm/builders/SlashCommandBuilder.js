const optionTypeMap = {
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
export class SlashCommandBuilder {
    constructor() {
        this.data = { name: '', description: '', options: [] };
    }
    setName(name) {
        this.data.name = name;
        return this;
    }
    setDescription(description) {
        this.data.description = description;
        return this;
    }
    addOption(option) {
        this.data.options.push({
            name: option.name,
            description: option.description,
            type: optionTypeMap[option.type],
            required: option.required ?? false,
            choices: option.choices,
        });
        return this;
    }
    toJSON() {
        return {
            name: this.data.name,
            description: this.data.description,
            options: this.data.options,
            type: 1,
        };
    }
}
//# sourceMappingURL=SlashCommandBuilder.js.map