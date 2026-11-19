# Set

Set is a workout journal for Telegram Mini Apps. Save exercises, record sets with weight and reps, and review your training history.

## Features

- Create and rename exercises.
- Log multiple sets for an exercise and edit or delete saved sets.
- View today's totals and filter your history by exercise.
- Add an exercise while logging sets.

## Run locally

Install Node.js, then run the following command in the project directory:

```sh
node server.js
```

Open http://127.0.0.1:4173 in a browser. The project has no dependencies to install or build step.

Run the journal tests with:

```sh
node --test
```

## Project structure

| Path | Purpose |
| --- | --- |
| `dist/index.html` and `dist/styles.css` | Page markup and styles |
| `dist/app.js` | Application startup and navigation |
| `dist/js/journal/` | Journal operations, local storage and dates |
| `dist/js/ui/` | Screens, dialogs and shared UI components |
| `dist/js/platform/` | Telegram Mini App integration |
| `server.js` | Local preview server |
| `package.json` | Node.js module configuration |
| `tests/` | Journal tests |
| `icon.png` | Profile image for the Telegram bot |

The `dist` directory contains the application's source files and is the directory to publish.

## Deploy

Upload the contents of `dist` to a static HTTPS host. For Cloudflare Pages Git integration, use `dist` as the build output directory and leave the build command empty.

In [@BotFather](https://t.me/BotFather), use `/setmenubutton` to point your bot's menu button to the deployed HTTPS address. See the [Telegram Mini Apps documentation](https://core.telegram.org/bots/webapps#launching-mini-apps-from-the-menu-button) for details.

## Data storage

Workouts are stored in the device's `localStorage`. The browser and Telegram use separate journals, and data is not synced across devices. The app does not require a bot token.
