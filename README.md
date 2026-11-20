<div align="center">
  <img src="dist/assets/icon.png" alt="Set logo" width="104" height="104">

  <h1>Set</h1>
  <p><strong>A simple workout journal, ready for Telegram.</strong></p>
  <p>Save your exercises. Log your sets. Follow your progress.</p>
</div>

---

## Your training, in one place

Set keeps the essentials close at hand during a workout.

- **Build your exercise library** — add and rename exercises, including while logging a set.
- **Record your work** — save multiple sets with weight and reps in one go.
- **See today's totals** — check your exercises, sets and reps at a glance.
- **Review your history** — filter by exercise, then edit or delete individual sets.

New sets use the current date on your device. You can change the date when editing a saved set.

## Run locally

You need Node.js installed. From the project folder, start the local server:

```sh
node server.js
```

Open [localhost:4173](http://127.0.0.1:4173). No dependency installation or build step is required.

To run the journal tests:

```sh
node --test
```

## Project structure

```text
dist/
├── index.html          Page markup
├── styles.css          App styles
├── app.js              Startup and navigation
├── assets/             Set logo and Telegram avatar
└── js/
    ├── journal/        Journal operations, storage and dates
    ├── platform/       Telegram integration
    └── ui/             Screens, forms and UI components
tests/                  Journal tests
server.js               Local preview server
```

## Data storage

Set stores workouts in `localStorage` on the device. Browser and Telegram sessions use separate journals, and data does not sync across devices. The app does not require a bot token.
