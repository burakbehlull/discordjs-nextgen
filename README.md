# discordjs-nextgen

[Turkish Documentation](./lang/tr.md)

Simple, fast, and modular Discord bot framework with both ESM and CommonJS support.

## Why discordjs-nextgen?

- Fluent API for quick setup
- Dynamic and recursive file loading
- Hybrid command system for Prefix + Slash
- Middleware support
- Unified `Context` abstraction
- Plugin system for modular extensions
- **Autocomplete support for slash commands**
- **Context Menu Commands (User & Message)**
- **New Select Menu Types (User, Role, Mentionable, Channel)**
- **Monetization & Entitlements support**
- **Localization (i18n) for commands**

## Installation

```bash
npm install discordjs-nextgen
```

## Quick Start

```ts
import { App, Intents, Logger, cooldown } from 'discordjs-nextgen';

const app = new App({
  intents: Intents.ALL,
});

app
  .use(Logger({
    colors: { info: 'cyan', error: 'red' },
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

## Core Concepts

### Hybrid Command

```ts
import { HybridCommand } from 'discordjs-nextgen';

const ping: HybridCommand = {
  name: 'ping',
  description: 'Measure latency',
  aliases: ['p'],
  run: async (ctx) => {
    const delay = Date.now() - ctx.createdAt.getTime();
    await ctx.reply(`Pong! Latency: **${delay}ms**`);
  },
};

export default ping;
```

### Slash Command with Autocomplete

```ts
import { SlashCommand, SlashCommandBuilder } from 'discordjs-nextgen';

const searchCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('search')
    .setDescription('Search for something')
    .addOption({
      name: 'query',
      description: 'Search query',
      type: 'string',
      autocomplete: true,
    }),
  autocomplete: async (ctx) => {
    const query = ctx.getFocused() as string;
    const choices = [
      { name: 'Option 1', value: 'opt1' },
      { name: 'Option 2', value: 'opt2' },
    ];
    await ctx.respond(choices);
  },
  run: async (ctx) => {
    await ctx.reply(`You searched for: ${ctx.values.query}`);
  },
};

export default searchCommand;
```

### Context Menu Commands

```ts
import { SlashCommand, SlashCommandBuilder } from 'discordjs-nextgen';

// User Context Menu (Right-click → Apps)
const userInfoCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('User Info')
    .setType(2), // 2 = USER
  run: async (ctx) => {
    const targetUser = ctx.targetUser;
    await ctx.reply(`User: ${targetUser?.tag}`);
  },
};

// Message Context Menu (Right-click → Apps)
const messageInfoCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('Message Info')
    .setType(3), // 3 = MESSAGE
  run: async (ctx) => {
    const targetMessage = ctx.targetMessage;
    await ctx.reply(`Message content: ${targetMessage?.content}`);
  },
};

export { userInfoCommand, messageInfoCommand };
```

### Localization (i18n) for Slash Commands

```ts
import { SlashCommand, SlashCommandBuilder } from 'discordjs-nextgen';

const greetCommand: SlashCommand = {
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
    await ctx.reply('Hello!');
  },
};

export default greetCommand;
```

### Button Handler

```ts
import { ButtonHandler } from 'discordjs-nextgen';

const verifyButton: ButtonHandler = {
  customId: 'verify_user',
  run: async (ctx) => {
    await ctx.reply({ content: 'Verified!', ephemeral: true });
  },
};

export default verifyButton;
```

### Modal

```ts
import { Modal } from 'discordjs-nextgen';

const feedbackModal = Modal.create('feedback_form')
  .title('Feedback')
  .short('name', { label: 'Your name' })
  .paragraph('comment', { label: 'Your comment', min: 10, max: 1000 })
  .onSubmit(async (ctx) => {
    await ctx.reply({
      content: `Thanks ${ctx.values.name}! Your feedback was received.`,
      ephemeral: true,
    });
  });

export default feedbackModal;
```

### Select Menus (All Types)

```ts
import { Select } from 'discordjs-nextgen';

// String Select
const colorSelect = Select.create('color_pick')
  .placeholder('Choose a color')
  .options([
    { label: 'Red', value: 'red' },
    { label: 'Blue', value: 'blue' },
  ])
  .onSelect(async (ctx) => {
    await ctx.reply(`Selected color: ${ctx.values.color_pick}`);
  });

// User Select
const userSelect = Select.create('user_pick', { type: 'user' })
  .placeholder('Choose a user')
  .onSelect(async (ctx) => {
    await ctx.reply(`Selected user: ${ctx.values.user_pick}`);
  });

// Role Select
const roleSelect = Select.create('role_pick', { type: 'role' })
  .placeholder('Choose a role')
  .onSelect(async (ctx) => {
    await ctx.reply(`Selected role: ${ctx.values.role_pick}`);
  });

// Mentionable Select (User + Role)
const mentionableSelect = Select.create('mentionable_pick', { type: 'mentionable' })
  .placeholder('Choose a user or role')
  .onSelect(async (ctx) => {
    await ctx.reply(`Selected: ${ctx.values.mentionable_pick}`);
  });

// Channel Select
const channelSelect = Select.create('channel_pick', { type: 'channel' })
  .placeholder('Choose a channel')
  .channelTypes([0, 5]) // 0 = Text, 5 = Announcement
  .onSelect(async (ctx) => {
    await ctx.reply(`Selected channel: ${ctx.values.channel_pick}`);
  });

export { colorSelect, userSelect, roleSelect, mentionableSelect, channelSelect };
```

## Monetization & Entitlements

```ts
import { SlashCommand } from 'discordjs-nextgen';

const premiumCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('premium')
    .setDescription('Premium feature'),
  run: async (ctx) => {
    // Check if user has premium for a specific SKU
    if (ctx.hasPremium('YOUR_SKU_ID')) {
      await ctx.reply('Welcome premium user!');
    } else {
      await ctx.reply('You need premium to use this feature!');
    }

    // Or check all entitlements
    console.log(ctx.entitlements);
  },
};

// Entitlement Events
app.on('entitlementCreate', (entitlement) => {
  console.log('New entitlement:', entitlement);
});

app.on('entitlementUpdate', (oldEntitlement, newEntitlement) => {
  console.log('Entitlement updated:', newEntitlement);
});

app.on('entitlementDelete', (entitlement) => {
  console.log('Entitlement deleted:', entitlement);
});
```

## Context API

`ctx` normalizes both message and interaction flows:

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
- `ctx.respond(choices)` (for autocomplete)

## Plugin System

```ts
app.use({
  name: 'my-plugin',
  setup: (bot) => {
    bot.on('ready', (user) => {
      console.log(`${user.tag} is ready`);
    });
  },
});
```

## API Highlights

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

### Helpers

- `Logger(options?)`
- `cooldown(seconds)`
- `EmbedBuilder`
- `ButtonBuilder`
- `ActionRowBuilder`
- `Modal`
- `Select`
- `SlashCommandBuilder`

## Events

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

## Notes

- Discord modals can only be opened from interactions, not regular message events.
- Prefix, slash, button, modal, and select flows can all share middleware.
- Context menu commands use type 2 (USER) or 3 (MESSAGE) in SlashCommandBuilder.
