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
- **Slash komutlari icin Autocomplete (Otomatik Tamamlama)**
- **Context Menu Komutlari (Kullanici & Mesaj)**
- **Yeni Secim Menu Tipleri (Kullanici, Rol, Bahsedilebilir, Kanal)**
- **Para Kazandirma ve Hak (Entitlements) destegi**
- **Komutlar icin Yerellestirme (i18n)**

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

### Autocomplete ile Slash Komutu

```ts
import { SlashCommand, SlashCommandBuilder } from 'discordjs-nextgen';

const aramaKomutu: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('arama')
    .setDescription('Bir sey arayin')
    .addOption({
      name: 'sorgu',
      description: 'Arama sorgusu',
      type: 'string',
      autocomplete: true,
    }),
  autocomplete: async (ctx) => {
    const sorgu = ctx.getFocused() as string;
    const secenekler = [
      { name: 'Secenek 1', value: 'sec1' },
      { name: 'Secenek 2', value: 'sec2' },
    ];
    await ctx.respond(secenekler);
  },
  run: async (ctx) => {
    await ctx.reply(`Aradiginiz: ${ctx.values.sorgu}`);
  },
};

export default aramaKomutu;
```

### Context Menu Komutlari

```ts
import { SlashCommand, SlashCommandBuilder } from 'discordjs-nextgen';

// Kullanici Context Menu (Sag tik → Uygulamalar)
const kullaniciBilgiKomutu: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('Kullanici Bilgisi')
    .setType(2), // 2 = USER
  run: async (ctx) => {
    const hedefKullanici = ctx.targetUser;
    await ctx.reply(`Kullanici: ${hedefKullanici?.tag}`);
  },
};

// Mesaj Context Menu (Sag tik → Uygulamalar)
const mesajBilgiKomutu: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('Mesaj Bilgisi')
    .setType(3), // 3 = MESSAGE
  run: async (ctx) => {
    const hedefMesaj = ctx.targetMessage;
    await ctx.reply(`Mesaj icerigi: ${hedefMesaj?.content}`);
  },
};

export { kullaniciBilgiKomutu, mesajBilgiKomutu };
```

### Slash Komutlari icin Yerellestirme (i18n)

```ts
import { SlashCommand, SlashCommandBuilder } from 'discordjs-nextgen';

const selamlaKomutu: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('greet')
    .setDescription('Greet someone')
    .setNameLocalizations({
      'tr': 'selamla',
      'es': 'saludar',
    })
    .setDescriptionLocalizations({
      'tr': 'Birini selamla',
      'es': 'Saludar a alguien',
    }),
  run: async (ctx) => {
    await ctx.reply('Merhaba!');
  },
};

export default selamlaKomutu;
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

### Secim Menuleri (Tum Tipler)

```ts
import { Select } from 'discordjs-nextgen';

// String Secim
const renkSecimi = Select.create('renk_sec')
  .placeholder('Bir renk secin')
  .options([
    { label: 'Kirmizi', value: 'red' },
    { label: 'Mavi', value: 'blue' },
  ])
  .onSelect(async (ctx) => {
    await ctx.reply(`Secilen renk: ${ctx.values.renk_sec}`);
  });

// Kullanici Secim
const kullaniciSecimi = Select.create('kullanici_sec', { type: 'user' })
  .placeholder('Bir kullanici secin')
  .onSelect(async (ctx) => {
    await ctx.reply(`Secilen kullanici: ${ctx.values.kullanici_sec}`);
  });

// Rol Secim
const rolSecimi = Select.create('rol_sec', { type: 'role' })
  .placeholder('Bir rol secin')
  .onSelect(async (ctx) => {
    await ctx.reply(`Secilen rol: ${ctx.values.rol_sec}`);
  });

// Bahsedilebilir Secim (Kullanici + Rol)
const bahsedilebilirSecimi = Select.create('bahsedilebilir_sec', { type: 'mentionable' })
  .placeholder('Bir kullanici veya rol secin')
  .onSelect(async (ctx) => {
    await ctx.reply(`Secilen: ${ctx.values.bahsedilebilir_sec}`);
  });

// Kanal Secim
const kanalSecimi = Select.create('kanal_sec', { type: 'channel' })
  .placeholder('Bir kanal secin')
  .channelTypes([0, 5]) // 0 = Metin, 5 = Duyuru
  .onSelect(async (ctx) => {
    await ctx.reply(`Secilen kanal: ${ctx.values.kanal_sec}`);
  });

export { renkSecimi, kullaniciSecimi, rolSecimi, bahsedilebilirSecimi, kanalSecimi };
```

## Para Kazandirma ve Hak (Entitlements)

```ts
import { SlashCommand } from 'discordjs-nextgen';

const premiumKomutu: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('premium')
    .setDescription('Premium ozellik'),
  run: async (ctx) => {
    // Belirli bir SKU icin premium kontrolu
    if (ctx.hasPremium('SIZIN_SKU_IDNIZ')) {
      await ctx.reply('Hos geldiniz premium kullanici!');
    } else {
      await ctx.reply('Bu ozelligi kullanmak icin premium gerekiyor!');
    }

    // Veya tum haklari kontrol edin
    console.log(ctx.entitlements);
  },
};

// Hak Olaylari
app.on('entitlementCreate', (hak) => {
  console.log('Yeni hak:', hak);
});

app.on('entitlementUpdate', (eskiHak, yeniHak) => {
  console.log('Hak guncellendi:', yeniHak);
});

app.on('entitlementDelete', (hak) => {
  console.log('Hak silindi:', hak);
});
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
- `ctx.commandName`
- `ctx.customId`
- `ctx.isCommand`
- `ctx.isSlashCommand`
- `ctx.isUserContext`
- `ctx.isMessageContext`
- `ctx.isModalSubmit`
- `ctx.targetId`
- `ctx.targetUser`
- `ctx.targetMessage`
- `ctx.entitlements`
- `ctx.hasPremium(skuId)`
- `ctx.getFocused(withValue?)`
- `ctx.respond(choices)` (autocomplete icin)

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
- `SlashCommandBuilder`

## Olaylar

- `ready`
- `messageCreate`
- `messageUpdate`
- `messageDelete`
- `guildCreate`
- `guildDelete`
- `channelCreate`
- `channelUpdate`
- `channelDelete`
- `interactionCreate`
- `voiceStateUpdate`
- `voiceServerUpdate`
- `entitlementCreate`
- `entitlementUpdate`
- `entitlementDelete`
- `error`

## Notlar

- Discord modallar sadece interaction uzerinden acilabilir, normal mesaj olaylarindan acilamaz.
- Prefix, slash, buton, modal ve secim akislari hepsi middleware paylasabilir.
- Context menu komutlari SlashCommandBuilder'da tip 2 (USER) veya 3 (MESSAGE) kullanir.
