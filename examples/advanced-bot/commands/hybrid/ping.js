
const pingHybrid = {
  name: 'ping',
  description: 'Hem prefix hem slash olarak çalışır!',
  run: async (ctx) => {
    const delay = Date.now() - ctx.createdAt.getTime();
    await ctx.reply(`Pong! Gecikme: **${delay}ms**`);
  },
};

export default pingHybrid;
