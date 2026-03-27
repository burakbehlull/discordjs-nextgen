import { Button, ActionRow } from 'discordjs-nextgen';

export default {
    name: 'test',
    description: 'Test komutu',
    run: async (ctx) => {
        const row = ActionRow.create(
            Button.create('testButton') 
                .setLabel('Selam Ver')
                .setStyle('Primary'),
            
            Button.create()
                .setLabel('Google')
                .setURL('https://google.com')
        );

        await ctx.reply({ content: 'Seçimini yap:', components: [row] });
    }
};