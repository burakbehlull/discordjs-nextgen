# discordjs-nextgen 🚀

Basit, hızlı ve modüler bir Discord bot framework'ü. Hem **ESM** hem de **CommonJS** desteği ile modern geliştirme standartlarına uygundur.

## 🌟 Neden discordjs-nextgen?

- **Fluent API**: Zincirleme metodlarla botunuzu saniyeler içinde yapılandırın.
- **Dinamik & Recursive Yükleyici**: Komutları, olayları ve butonları alt klasörleriyle birlikte otomatik olarak yükleyin.
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

  // 5. Modal Etkileşimlerini Yükle
  .modal({ folder: 'modals' })

  // 6. Prefix & Slash Komutları
  .prefix({ folder: 'commands/prefix', prefix: '!' })
  .slash({ folder: 'commands/slash' })

  // 7. Olayları Yükle
  .events('events')

  // 8. Botu Çalıştır
  .run('YOUR_DISCORD_TOKEN');
```

> **Önemli Not:** Discord API gereği, Modallar sadece **Interaction** (Slash Komutları, Butonlar, Select Menüler) üzerinden açılabilir. Standart Prefix komutlarında veya `messageCreate` gibi mesaj tabanlı eventlerde modal **gösterilemez**.

## 🧩 Modüler Kullanım

### Hibrit Komut ve Modal (HybridCommand)
Tek bir kodla hem Prefix hem Slash olarak çalışan bir komutta modal kullanımı:

`commands/hybrid/feedback.ts`
```typescript
import { HybridCommand } from 'discordjs-nextgen';

const feedbackCommand: HybridCommand = {
  name: 'feedback',
  description: 'Geri bildirim formunu açar',
  run: async (ctx) => {
    // Prefix komutu olarak kullanılırsa hata almamak için kontrol
    if (!ctx.isInteraction) {
      return ctx.reply('Üzgünüm, bu formu sadece slash komutu (/feedback) kullanarak doldurabilirsin.');
    }

    // Modal ID ile gösterme (app.modal ile kaydedilmiş olmalı)
    await ctx.showModal('feedback_form');
  },
};

export default feedbackCommand;
```

### Slash Komutu ve Modal
Sadece slash komutu üzerinden modal açma ve **category**, **usage**, **aliases** (ayrı komut olarak kaydedilir) kullanımı:

`commands/slash/register.ts`
```typescript
import { Modal, SlashCommandBuilder } from 'discordjs-nextgen';

const registerCommand = {
  data: new SlashCommandBuilder()
    .setName('kayıt')
    .setDescription('Kayıt formunu açar'),
  category: 'user', // Komut kategorisi
  usage: 'kayıt', // Kullanım şekli
  aliases: ['register'], // Discord'da ayrı bir slash komutu olarak kaydedilir
  run: async (ctx) => {
    // Manuel modal oluşturup gösterme
    const modal = Modal.create('reg_modal')
      .title('Kayıt Sistemi')
      .short('username', { label: 'Kullanıcı Adı' })
      .paragraph('bio', { label: 'Hakkında', required: false });

    await ctx.showModal(modal);
  }
};

export default registerCommand;
```

### Hibrit Komut (HybridCommand)
`commands/hybrid/ping.ts`
```typescript
import { HybridCommand } from 'discordjs-nextgen';

const pingHybrid: HybridCommand = {
  name: 'ping',
  description: 'Gecikmeyi ölçer',
  aliases: ['p'], // Alternatif isimler
  usage: 'ping', // Kullanım şekli
  category: 'genel', // Komut kategorisi
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

### Olaylar (Events)
Olayları bir klasörden yükleyebilirsiniz:

`events/ready.ts`
```typescript
import { AppEvent } from 'discordjs-nextgen';

const readyEvent: AppEvent<'ready'> = {
  name: 'ready',
  run: (user) => {
    console.log(`${user.tag} hazır!`);
  }
};

export default readyEvent;
```

> **Not:** `messageCreate` gibi mesaj tabanlı olaylarda modal açılamaz. Ancak `interactionCreate` olayı içinde gelen etkileşime göre `ctx.showModal()` kullanabilirsiniz.

#### Olaylar İçinde Modal Kullanımı (Detaylı)

**Hatalı Kullanım (`messageCreate`):**
Discord kuralları gereği, bir mesaj yazıldığında botun karşısına modal (form) çıkaramazsınız.

`events/messageCreate.ts`
```typescript
import { AppEvent, Context } from 'discordjs-nextgen';

const messageEvent: AppEvent<'messageCreate'> = {
  name: 'messageCreate',
  run: async (message) => {
    if (message.content === '!form') {
      const ctx = new Context(message);
      // HATA: Discord mesajlara modal ile yanıt vermeyi desteklemez.
      // await ctx.showModal('feedback_form'); 
      
      await ctx.reply('Üzgünüm, Discord sadece butonlar veya slash komutları üzerinden form (modal) açılmasına izin verir.');
    }
  }
};
```

**Doğru Kullanım (`interactionCreate`):**
Eğer hazır `.button()` veya `.slash()` handler'larını kullanmıyorsanız, manuel olarak `interactionCreate` içinde modal açabilirsiniz.

`events/interactionCreate.ts`
```typescript
import { AppEvent, Context } from 'discordjs-nextgen';

const interactionEvent: AppEvent<'interactionCreate'> = {
  name: 'interactionCreate',
  run: async (interaction) => {
    // Eğer bir butona basıldıysa ve ID'si eşleşiyorsa
    if (interaction.isButton && interaction.customId === 'open_form') {
      const ctx = new Context(interaction);
      await ctx.showModal('feedback_form');
    }
  }
};
```

### Modal İşleyici (Modal)
`.modal({ folder: 'modals' })` kullandığınızda, bu klasördeki dosyalar birer `Modal` nesnesi export etmelidir.

`modals/feedback.ts`
```typescript
import { Modal } from 'discordjs-nextgen';

const feedbackModal = Modal.create('feedback_form')
  .title('Geri Bildirim')
  .short('name', { label: 'Adınız', placeholder: 'Buraya yazın...' })
  .paragraph('comment', { label: 'Yorumunuz', min: 10, max: 1000 })
  .onSubmit(async (ctx) => {
    // ctx.values ile form verilerine erişebilirsiniz
    const name = ctx.values.name;
    const comment = ctx.values.comment;
    
    await ctx.reply({ content: `Teşekkürler ${name}! Yorumun alındı.`, ephemeral: true });
  });

export default feedbackModal;
```

### Prefix Komutu (Özel Ayarlar)
`commands/prefix/admin.ts`
```typescript
import { PrefixCommand } from 'discordjs-nextgen';

const adminCommand: PrefixCommand = {
  name: 'temizle',
  aliases: ['purge'],
  usage: 'temizle <miktar>',
  category: 'yetkili',
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
- `ctx.showModal(modal)`: Bir modal formu açar (sadece Interaction).
- `ctx.values`: Modal submit eyleminde form verilerine erişir.
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

### Dinamik & Recursive Yükleme
`discordjs-nextgen` dosya yapınızı özgürce düzenlemenize olanak tanır. Alt klasörler otomatik olarak taranır:

```text
src/
  commands/
    general/
      ping.ts
      help.ts
    admin/
      ban.ts
      kick.ts
  events/
    guild/
      ready.ts
    message/
      messageCreate.ts
```

`app.prefix({ folder: 'commands' })` veya `app.events('events')` dediğinizde, framework tüm alt klasörleri dolaşarak dosyaları yükler.

### Komutlara Programatik Erişim
Kayıtlı tüm komutlara erişerek otomatik yardım menüleri oluşturabilirsiniz:

```typescript
app.on('ready', () => {
  // Kayıtlı prefix komutlarını Map olarak al
  const pCmds = app.prefixCommands;
  
  // Kayıtlı slash komutlarını Map olarak al
  const sCmds = app.slashCommands;

  console.log(`${pCmds.size} Prefix, ${sCmds.size} Slash komutu yüklü.`);
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
- `.modal({ folder })`: Klasörden modal işleyicilerini yükler.
- `.modal(modalInstance)`: Bir `Modal` nesnesini doğrudan kaydeder.
- `.events(folder)`: Belirtilen klasördeki event dosyalarını yükler.
- `.run(token)`: Botu başlatır (alternatif: `.login(token)`).
- `.setPresence(data)`: Botun durumunu (aktif, boşta, dnd) ve aktivitesini ayarlar.
- `.fetchUser(id)` / `.fetchGuild(id)` / `.fetchChannel(id)`: Discord API'den veri çeker.
- `.prefixCommands`: Kayıtlı prefix komutlarını içeren Map.
- `.slashCommands`: Kayıtlı slash komutlarını içeren Map.
- `.modals`: Kayıtlı modalları içeren Map.

### Yardımcı Fonksiyonlar & Sınıflar
- `Logger(options?)`: **Middleware** olarak kullanılır. `app.use(Logger())`.
- `Logger.info()`, `Logger.error()`, `Logger.success()`: **Doğrudan** loglama yapmak için kullanılır.
- `cooldown(seconds)`: **Middleware** olarak kullanılır. `app.use(cooldown(5))`.
- `EmbedBuilder`: Zengin mesaj içerikleri oluşturmak için.
- `ButtonBuilder` & `ActionRowBuilder`: Butonlu mesajlar oluşturmak için.
- `Modal`: Etkileşimli formlar oluşturmak için.

## 📄 Lisans
MIT
