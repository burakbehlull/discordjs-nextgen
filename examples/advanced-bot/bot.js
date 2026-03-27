import { App, Intents, Logger, cooldown } from 'discordjs-nextgen';

import "dotenv/config"


const app = new App({
    intents: Intents.ALL
});


// plugins & middleware
app.use(Logger({
    colors: {
        info: 'cyan',
        warn: 'yellow',
        error: 'red',
    },
}));

app.use(cooldown(10));


// commands & events & buttons & modals & selects
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
  .button({
    folder: 'buttons',
  })
  .modal({
    folder: 'modals',
  })
  .select({
    folder: 'selects',
  });


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


