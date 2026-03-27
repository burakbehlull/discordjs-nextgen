import { SlashCommandBuilder } from 'discordjs-nextgen';

const sayHello = {
    data: new SlashCommandBuilder()
        .setName('hello')
        .setDescription('hello'),
    run: async (ctx) => {
        await ctx.reply("hi");
    }
};

export default sayHello;