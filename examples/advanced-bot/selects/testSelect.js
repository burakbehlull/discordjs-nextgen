import { Select } from 'discordjs-nextgen';

const testSelect = Select.create('testSelect')
    .placeholder('Favori rengini seç...')
    .options([
      { label: 'Kırmızı', value: 'red', description: 'Enerjinin rengi' },
      { label: 'Mavi', value: 'blue', description: 'Huzurun rengi' },
      { label: 'Yeşil', value: 'green', description: 'Doğanın rengi' }
    ])
    .onSelect(async (ctx) => {
      const secilen = ctx.values.testSelect;
      await ctx.reply(`Harika seçim! Demek favori rengin: **${secilen}**`);
    });

export default testSelect;