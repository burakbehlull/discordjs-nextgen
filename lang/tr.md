# discordjs-nextgen

[English README](../README.md)

Basit, hizli ve moduler bir Discord bot framework'u. Hem **ESM** hem de **CommonJS** destegi ile modern gelistirme standartlarina uygundur.

## Neden discordjs-nextgen?

- **Fluent API**: Zincirleme metodlarla botunuzu saniyeler icinde yapilandirin.
- **Dinamik ve Recursive Yukleyici**: Komutlari, olaylari ve butonlari alt klasorleriyle birlikte otomatik yukleyin.
- **Hibrit Komut Sistemi**: Tek kodla hem Prefix hem Slash komutu olusturun.
- **Middleware Destegi**: Komutlar oncesi calisacak ara yazilimlar ekleyin.
- **Context Abstraction**: Mesaj ve interaction yapilarini tek bir `Context` nesnesiyle yonetin.
- **Plugin Sistemi**: Kutuphaneyi eklentilerle moduler sekilde genisletin.

## Kurulum

```bash
npm install discordjs-nextgen
```

## Hizli Baslangic

```ts
import { App, Intents, Logger, cooldown } from 'discordjs-nextgen';

const app = new App({
  intents: Intents.ALL,
});

app
  .use(Logger({
    colors: { info: 'cyan', error: 'red' }
  }))
  .use(cooldown(3))
  .command({ folder: 'commands/hybrid' })
  .button({ folder: 'buttons' })
  .modal({ folder: 'modals' })
  .select({ folder: 'selects' })
  .prefix({ folder: 'commands/prefix', prefix: '!' })
  .slash({ folder: 'commands/slash' })
  .events('events')
  .run('YOUR_DISCORD_TOKEN');
```

> Onemli Not: Discord API geregi modallar sadece interaction uzerinden acilabilir. Prefix komutlari veya `messageCreate` gibi mesaj tabanli eventlerde modal gosterilemez.

## Moduler Kullanim

### Hibrit Komut

```ts
import { HybridCommand } from 'discordjs-nextgen';

const pingHybrid: HybridCommand = {
  name: 'ping',
  description: 'Gecikmeyi olcer',
  aliases: ['p'],
  usage: 'ping',
  category: 'genel',
  run: async (ctx) => {
    const delay = Date.now() - ctx.createdAt.getTime();
    await ctx.reply(`Pong! Gecikme: **${delay}ms**`);
  },
};

export default pingHybrid;
```

### Buton Isleyici

```ts
import { ButtonHandler } from 'discordjs-nextgen';

const verifyButton: ButtonHandler = {
  customId: 'verify_user',
  run: async (ctx) => {
    await ctx.reply({ content: 'Dogrulandiniz!', ephemeral: true });
  },
};

export default verifyButton;
```

### Modal

```ts
import { Modal } from 'discordjs-nextgen';

const feedbackModal = Modal.create('feedback_form')
  .title('Geri Bildirim')
  .short('name', { label: 'Adiniz' })
  .paragraph('comment', { label: 'Yorumunuz', min: 10, max: 1000 })
  .onSubmit(async (ctx) => {
    await ctx.reply({
      content: `Tesekkurler ${ctx.values.name}! Yorumunuz alindi.`,
      ephemeral: true,
    });
  });

export default feedbackModal;
```

### Secim Menusu

```ts
import { Select } from 'discordjs-nextgen';

const colorSelect = Select.create('color_pick')
  .placeholder('Bir renk secin')
  .options([
    { label: 'Kirmizi', value: 'red' },
    { label: 'Mavi', value: 'blue' },
  ])
  .onSelect(async (ctx) => {
    await ctx.reply(`Secilen renk: ${ctx.values.color_pick}`);
  });

export default colorSelect;
```

## Context Sistemi

`ctx` nesnesi hem mesaj hem interaction akislarini normalize eder:

- `ctx.user`
- `ctx.guild`
- `ctx.channel`
- `ctx.reply(content | options)`
- `ctx.deferReply(ephemeral?)`
- `ctx.editReply(content | options)`
- `ctx.followUp(content | options)`
- `ctx.showModal(modal)`
- `ctx.values`
- `ctx.args`
- `ctx.isInteraction`
- `ctx.createdAt`

## Plugin Sistemi

```ts
app.use({
  name: 'my-plugin',
  setup: (bot) => {
    bot.on('ready', (user) => {
      console.log(`${user.tag} hazir`);
    });
  },
});
```

## API Ozetleri

### `App`

- `.use(fn | plugin)`
- `.command({ folder })`
- `.prefix({ folder, prefix })`
- `.slash({ folder, guildId? })`
- `.button({ folder })`
- `.button(customId, callback)`
- `.select({ folder })`
- `.modal({ folder })`
- `.events(folder)`
- `.run(token)`
- `.login(token)`

### Yardimcilar

- `Logger(options?)`
- `cooldown(seconds)`
- `EmbedBuilder`
- `ButtonBuilder`
- `ActionRowBuilder`
- `Modal`
- `Select`

## Lisans

MIT
