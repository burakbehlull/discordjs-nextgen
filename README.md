# discordjs-nextgen 🚀

Basit, hızlı ve modüler bir Discord bot framework'ü. Hem **ESM** hem de **CommonJS** desteği ile modern geliştirme standartlarına uygundur.

## 🌟 Neden discordjs-nextgen?

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
import { App, Intents, Logger, cooldown } from 'discordjs-nextgen';

const app = new App({
  intents: Intents.ALL,
});

app
  // 1. Logger Middleware (Renklendirme seçeneği ile)
  .use(Logger({
    colors: { info: 'cyan', error: 'red' }
  }))
  
  // 2. Global Cooldown (Tüm komutlar için 3 saniye)
  .use(cooldown(3))

  // 3. Hibrit Komutları Yükle (Hem ! hem / olarak çalışır)
  .command({ folder: 'commands/hybrid' })

  // 4. Buton Etkileşimlerini Yükle
  .button({ folder: 'buttons' })
  // Veya Fluent API ile doğrudan tanımla:
  .button('verify_btn', async (ctx) => {
    await ctx.reply('Başarıyla doğrulandınız!');
  })

  // 5. Prefix & Slash Komutları
  .prefix({ folder: 'commands/prefix', prefix: '!' })
  .slash({ folder: 'commands/slash' })

  // 6. Olayları Yükle
  .events('events')

  // 7. Botu Çalıştır
  .run('YOUR_DISCORD_TOKEN');
```

## 🧩 Modüler Kullanım

### Hibrit Komut (HybridCommand)
`commands/hybrid/ping.ts`
```typescript
import { HybridCommand } from 'discordjs-nextgen';

const pingHybrid: HybridCommand = {
  name: 'ping',
  description: 'Gecikmeyi ölçer',
  run: async (ctx) => {
    const delay = Date.now() - ctx.createdAt.getTime();
    await ctx.reply(`Pong! Gecikme: **${delay}ms**`);
  },
};

export default pingHybrid;
```

### Buton İşleyici (ButtonHandler)
`.button({ folder: 'buttons' })` kullandığınızda, bu klasördeki her dosya bir buton işleyici olarak yüklenir.

`buttons/verify.ts`
```typescript
import { ButtonHandler } from 'discordjs-nextgen';

const verifyButton: ButtonHandler = {
  customId: 'verify_user', // Butonun custom_id'si ile eşleşir
  run: async (ctx) => {
    // ctx.user butonun basan kullanıcıdır
    await ctx.reply({ content: 'Doğrulandınız!', ephemeral: true });
  },
};

export default verifyButton;
```

### Prefix Komutu (Özel Ayarlar)
`commands/prefix/admin.ts`
```typescript
import { PrefixCommand } from 'discordjs-nextgen';

const adminCommand: PrefixCommand = {
  name: 'temizle',
  aliases: ['purge'],
  cooldown: 5, // Komuta özel 5 sn cooldown
  permissions: ['MANAGE_MESSAGES'],
  run: async (ctx, args) => {
    const amount = parseInt(args[0]) || 10;
    await ctx.reply(`${amount} mesaj siliniyor...`);
  },
};

export default adminCommand;
```

## 🧠 Gelişmiş Özellikler

### Context Sistemi (`ctx`)
`ctx` nesnesi hem Mesaj (Prefix) hem de Etkileşim (Slash/Button) verilerini normalize eder:
- `ctx.user`: Eylemi gerçekleştiren kullanıcı (User nesnesi).
- `ctx.guild`: Sunucu nesnesi (varsa).
- `ctx.channel`: Kanal nesnesi (varsa).
- `ctx.reply(content | options)`: Akıllı yanıt sistemi. Interaction ise `reply()`, mesaj ise `reply()`/`send()` yapar.
- `ctx.deferReply(ephemeral?)`: Yanıtı geciktirir (sadece Interaction).
- `ctx.editReply(content | options)`: Geciktirilmiş yanıtı düzenler.
- `ctx.followUp(content | options)`: Yeni bir yanıt gönderir.
- `ctx.args`: Prefix komutlarında kelime dizisi, Slash komutlarında opsiyon değerleri.
- `ctx.isInteraction`: Eylemin bir Interaction (Slash/Button) olup olmadığını belirtir.
- `ctx.createdAt`: Eylemin oluşturulma zamanı.

### Middleware Sistemi
Kendi ara yazılımlarınızı yazın. Middleware'ler komut çalışmadan önce çalışır:
```typescript
app.use(async (ctx, next) => {
  // Komut çalışmadan önce:
  Logger.info(`${ctx.user.tag} bir eylem başlattı.`);
  
  await next(); // Komutu (veya bir sonraki middleware'i) çalıştır
  
  // Komut bittikten sonra:
  Logger.success(`Eylem tamamlandı.`);
});
```

### Plugin Sistemi
Botunuzu modüler parçalarla genişletin:
```typescript
app.use({
  name: 'my-plugin',
  setup: (bot) => {
    bot.on('ready', (user) => Logger.info(`${user.tag} için plugin hazır!`));
  }
});
```

## 📚 API Referansı

### `App` Metotları
- `.use(fn | plugin)`: Middleware veya Plugin ekler.
- `.command({ folder })`: Belirtilen klasördeki hibrit komutları yükler.
- `.prefix({ folder, prefix })`: Prefix komutlarını klasörden yükler ve prefix ayarlar.
- `.slash({ folder, guildId? })`: Slash komutlarını klasörden yükler.
- `.button({ folder })`: Klasörden buton işleyicilerini yükler.
- `.button(customId, callback)`: Fluent API ile inline buton işleyicisi tanımlar.
- `.events(folder)`: Belirtilen klasördeki event dosyalarını yükler.
- `.run(token)`: Botu başlatır (alternatif: `.login(token)`).
- `.setPresence(data)`: Botun durumunu (aktif, boşta, dnd) ve aktivitesini ayarlar.
- `.fetchUser(id)` / `.fetchGuild(id)` / `.fetchChannel(id)`: Discord API'den veri çeker.

### Yardımcı Fonksiyonlar & Sınıflar
- `Logger(options?)`: **Middleware** olarak kullanılır. `app.use(Logger())`.
- `Logger.info()`, `Logger.error()`, `Logger.success()`: **Doğrudan** loglama yapmak için kullanılır.
- `cooldown(seconds)`: **Middleware** olarak kullanılır. `app.use(cooldown(5))`.
- `EmbedBuilder`: Zengin mesaj içerikleri oluşturmak için.
- `ButtonBuilder` & `ActionRowBuilder`: Butonlu mesajlar oluşturmak için.

## 📄 Lisans
MIT
