import { Modal } from 'discordjs-nextgen';

const testModal = Modal.create('testModal')
  .title('Geri Bildirim')
  .short('name', { label: 'Adınız', placeholder: 'Buraya yazın...' })
  .paragraph('comment', { label: 'Yorumunuz', min: 10, max: 1000 })
  .onSubmit(async (ctx) => {
    const name = ctx.values.name;
    const comment = ctx.values.comment;
    
    await ctx.reply({ content: `Teşekkürler ${name}! Yorumun alındı.`, ephemeral: true });
  });

export default testModal;