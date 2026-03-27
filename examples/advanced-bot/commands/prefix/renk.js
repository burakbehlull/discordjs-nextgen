import { ActionRow } from 'discordjs-nextgen';

export default { 
    name: 'renk', 
    description: 'renk sec', 
    run: async (ctx) => { 
        const selectMenu = ctx.app.selects.get('testSelect'); 
        
        if (!selectMenu) return ctx.reply('Menü bulunamadı!'); 

        const row = ActionRow.create(selectMenu); 

        await ctx.reply({ 
            content: 'Lütfen aşağıdan bir renk seç:', 
            components: [row] 
        }); 
    } 
};