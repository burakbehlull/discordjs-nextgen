# discordjs-nextgen 🚀

Basit, hızlı ve modüler bir Discord bot framework'ü. Hem **ESM** hem de **CommonJS** desteği ile modern geliştirme standartlarına uygundur.

## 🌟 Neden discordjs-nextgen?

- **TypeScript Desteği**: Tam tip güvenliği ve otomatik tamamlamalar (IntelliSense) ile hatasız geliştirme.
- **Hibrit Modül**: Hem **ESM** (`import`) hem de **CommonJS** (`require`) projeleriyle %100 uyumlu.
- **Fluent API**: Zincirleme metodlarla botunuzu saniyeler içinde yapılandırın.
- **Dinamik Yükleyici**: Komutları, olayları ve butonları klasörlerden otomatik olarak yükleyin.
- **Hibrit Komut Sistemi**: Tek kodla hem Prefix hem Slash komutu oluşturun.
- **Middleware Desteği**: Komutlar öncesi çalışacak ara yazılımlar (logging, auth, cooldown vb.) ekleyin.
- **Context Abstraction**: Mesaj ve Interaction yapılarını tek bir `Context` nesnesiyle yönetin.
- **Plugin Sistemi**: Kütüphaneyi eklentilerle modüler bir şekilde genişletin.

## 📦 Kurulum

```bash
npm install discordjs-nextgen
# veya
yarn add discordjs-nextgen
```

## 🛠️ Hızlı Başlangıç 

### Ana Dosya (bot.ts)

```typescript
import { App, Intents } from 'discordjs-nextgen';

const app = new App({
  intents: Intents.ALL,
});

app
  // 1. Middleware (Ara Yazılım)
  .use((ctx, next) => {
    console.log(`[LOG] ${ctx.author.tag} komut kullandı.`);
    next();
  })
  // 2. Hibrit Komutları Yükle (Hem ! hem / olarak çalışır)
  .command({
    folder: 'commands/hybrid'
  })
  // 3. Buton Etkileşimlerini Yükle
  .button({
    folder: 'buttons'
  })
  // 4. Sadece Prefix Komutları
  .prefix({
    folder: 'commands/prefix',
    prefix: '!',
  })
  // 5. Sadece Slash Komutları
  .slash({
    folder: 'commands/slash'
  })
  // 6. Olayları Yükle
  .events('events')
  // 7. Botu Çalıştır
  .run('YOUR_DISCORD_TOKEN');
```

## 🧩 Örnekler

### Hibrit Komut (HybridCommand)
`commands/hybrid/ping.ts`
```typescript
import { HybridCommand } from 'discordjs-nextgen';

const pingHybrid: HybridCommand = {
  name: 'ping',
  description: 'Hem prefix hem slash olarak çalışır!',
  run: async (ctx) => {
    const delay = Date.now() - ctx.createdAt.getTime();
    await ctx.reply(`Pong! Gecikme: **${delay}ms**`);
  },
};

export default pingHybrid;
```

### Buton İşleyici (ButtonHandler)
`buttons/verify.ts`
```typescript
import { ButtonHandler } from 'discordjs-nextgen';

const verifyButton: ButtonHandler = {
  customId: 'verify_user',
  run: async (ctx) => {
    await ctx.reply({ content: 'Başarıyla doğrulandınız!', ephemeral: true });
  },
};

export default verifyButton;
```

### Prefix Komutu (Cooldown & Yetki)
`commands/prefix/slow.ts`
```typescript
import { PrefixCommand } from 'discordjs-nextgen';

const slowCommand: PrefixCommand = {
  name: 'slow',
  description: 'Bekleme süreli komut',
  cooldown: 10, // 10 saniye
  permissions: ['MANAGE_MESSAGES'],
  run: async (ctx) => {
    await ctx.reply('Bu komut 10 saniyede bir kullanılabilir.');
  },
};

export default slowCommand;
```

### Olay (AppEvent)
`events/ready.ts`
```typescript
import { AppEvent } from 'discordjs-nextgen';

const readyEvent: AppEvent<'ready'> = {
  name: 'ready',
  once: true,
  run: (user) => {
    console.log(`${user.tag} hazır!`);
  },
};

export default readyEvent;
```

## 🧠 Gelişmiş Özellikler

### Context Sistemi
`ctx` nesnesi, mesajın veya etkileşimin (interaction) tüm detaylarını ortak bir yapıda sunar:
- `ctx.user`: Komutu kullanan kullanıcı.
- `ctx.guild`: Komutun kullanıldığı sunucu.
- `ctx.channel`: Komutun kullanıldığı kanal.
- `ctx.reply()`: Mesaj veya etkileşime yanıt verme.
- `ctx.deferReply()`: Yanıtı erteler (Slash komutları için).
- `ctx.followUp()`: Ertelenmiş veya yanıtlanmış komuta ek yanıt gönderir.
- `ctx.editReply()`: Mevcut yanıtı düzenler.
- `ctx.isInteraction`: Komut slash mı?
- `ctx.args`: Komut argümanları (dizi).
- `ctx.memberPermissions`: Kullanıcının yetkileri.

### Middleware Sistemi
Her komut çalışmadan önce çalışacak fonksiyonlar zinciri:
```typescript
app.use(async (ctx, next) => {
  if (ctx.user.id === 'BANLI_ID') return; // Komutu durdurur
  await next(); // Zinciri devam ettirir
});
```

### Plugin Sistemi
Eklenti bazlı geliştirme:
```typescript
app.use({
  name: 'my-plugin',
  setup: (bot) => {
    bot.on('ready', () => console.log('Plugin hazır!'));
  }
});
```

## 📚 API Referansı

### `App` Sınıfı

- `new App(options)`: Yeni bir uygulama örneği oluşturur.
- `.use(middleware | plugin)`: Ara yazılım veya eklenti ekler.
- `.prefix(options)`: Prefix komutlarını yapılandırır.
- `.slash(options)`: Slash komutlarını yapılandırır.
- `.command(options)`: Hibrit komutları yapılandırır.
- `.button(options)`: Buton işleyicilerini yapılandırır.
- `.events(folder)`: Olayları klasörden yükler.
- `.run(token)`: Botu başlatır.
- `.fetchUser(id)`: Kullanıcı verilerini çeker.
- `.fetchGuild(id)`: Sunucu verilerini çeker.
- `.setPresence(data)`: Bot durumunu günceller.

### `Context` Nesnesi

Her komutun `run` fonksiyonuna iletilen nesnedir:
- `ctx.author`: Komutu çalıştıran `User`.
- `ctx.message`: Eğer prefix komutuysa `Message` nesnesi, değilse `null`.
- `ctx.interaction`: Eğer slash komutuysa `Interaction` nesnesi, değilse `null`.
- `ctx.isInteraction`: Komutun etkileşim (slash) olup olmadığını belirtir.
- `ctx.createdAt`: Komutun oluşturulma tarihi (`Date`).
- `ctx.args`: Komutla birlikte gelen argümanlar dizisi.
- `ctx.reply(content | options)`: Kullanıcıya yanıt verir.

## 📄 Lisans
MIT
