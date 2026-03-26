# discordjs-nextgen

Basit, hızlı ve modüler bir Discord bot kütüphanesi. Hem **ESM** hem de **CommonJS** desteği ile modern geliştirme standartlarına uygundur.

## 🚀 Özellikler

- **Dinamik Yükleyici**: Komutları ve eventleri klasörlerden otomatik olarak yükleyin.
- **Prefix & Slash Desteği**: Hem geleneksel prefix komutlarını hem de modern slash komutlarını kolayca yönetin.
- **Event Yönetimi**: Olayları modüler dosyalar halinde düzenleyin.
- **Hibrit Modül**: Hem `import` hem de `require` ile sorunsuz çalışır.
- **TypeScript Desteği**: Tam tip güvenliği ile hatasız geliştirme.

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
  intents: Intents.ALL, // Gerekli intentleri belirleyin
});

// 1. Prefix Komutlarını Yükle
app.prefix({
  folder: 'commands/prefix',
  prefix: '!',
  ignoreBots: true
});

// 2. Slash Komutlarını Yükle
app.slash({
  folder: 'commands/slash'
});

// 3. Eventleri (Olayları) Yükle
app.events('events');

app.login('YOUR_DISCORD_TOKEN');
```

### Örnek Prefix Komutu
`commands/prefix/ping.ts`
```typescript
import { PrefixCommand } from 'discordjs-nextgen';

const pingCommand: PrefixCommand = {
  name: 'ping',
  run: async (message) => {
    await message.reply('Pong!');
  },
};

export default pingCommand;
```

### Örnek Slash Komutu
`commands/slash/ping.ts`
```typescript
import { SlashCommandBuilder, SlashCommand } from 'discordjs-nextgen';

const pingSlash: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Botun gecikmesini ölçer'),
  run: async (interaction) => {
    await interaction.reply('Pong!');
  },
};

export default pingSlash;
```

### Örnek Event
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

## 📖 Metodlar

### `app.prefix(options)`
Prefix komutlarını yapılandırır ve klasörden yükler.
- `folder`: Komutların bulunduğu klasör yolu.
- `prefix`: Botun kullanacağı prefix (Dize veya dizi).
- `ignoreBots`: Bot mesajlarının yoksayılıp sayılmayacağı.

### `app.slash(options)`
Slash komutlarını yapılandırır ve klasörden yükler.
- `folder`: Komutların bulunduğu klasör yolu.
- `guildId`: (Opsiyonel) Komutları sadece belirli bir sunucuya kaydetmek için.

### `app.events(folderPath)`
Belirtilen klasördeki tüm event dosyalarını otomatik olarak yükler.

## 📄 Lisans
MIT
