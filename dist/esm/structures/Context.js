export class Context {
    constructor(source, args = []) {
        this.source = source;
        this.args = args;
        this.isInteraction = !('author' in source);
        this.user = this.isInteraction ? source.user : source.author;
        this.guild = source.guild || null;
        this.channel = source.channel || null;
    }
    async reply(options) {
        if (this.isInteraction) {
            const interaction = this.source;
            if (typeof options === 'string') {
                await interaction.reply({ content: options });
            }
            else {
                await interaction.reply(options);
            }
        }
        else {
            const message = this.source;
            await message.reply(options);
        }
    }
    async deferReply(ephemeral = false) {
        if (!this.isInteraction) {
            throw new Error('deferReply sadece interaction contextinde kullanilabilir.');
        }
        await this.source.deferReply(ephemeral);
    }
    async followUp(options) {
        if (this.isInteraction) {
            await this.source.followUp(options);
            return;
        }
        await this.source.reply(options);
    }
    async editReply(options) {
        if (!this.isInteraction) {
            throw new Error('editReply sadece interaction contextinde kullanilabilir.');
        }
        await this.source.editReply(options);
    }
    get author() {
        return this.user;
    }
    get message() {
        return !this.isInteraction ? this.source : null;
    }
    get interaction() {
        return this.isInteraction ? this.source : null;
    }
    get createdAt() {
        return this.isInteraction ? this.source.createdAt : this.source.createdAt;
    }
    get commandName() {
        return this.interaction?.commandName ?? null;
    }
    get customId() {
        return this.interaction?.customId ?? null;
    }
    get memberPermissions() {
        return this.isInteraction
            ? this.source.memberPermissions
            : this.source.memberPermissions;
    }
}
//# sourceMappingURL=Context.js.map