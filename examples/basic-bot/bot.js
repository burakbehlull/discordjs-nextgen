import { App, Intents, Logger, cooldown } from 'discordjs-nextgen';

import "dotenv/config"

const app = new App({
    intents: Intents.ALL
});


// plugin
app.use(Logger({
    colors: {
        info: 'cyan',
        warn: 'yellow',
        error: 'red',
    },
}));

// commands & events
app
  .events('events')
  .prefix({
    folder: 'commands/prefix',
    prefix: '.',
  })
  .slash({
    folder: 'commands/slash',
  })
  .command({
    folder: 'commands/hybrid',
  })


// presence
app.setPresence({
    status: 'idle',
    activities: [
        {
            name: 'NextGen Advanced',
            type: 0
        },
    ],
});


// run
app.run(process.env.TOKEN);


