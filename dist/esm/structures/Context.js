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
}
//# sourceMappingURL=Context.js.map