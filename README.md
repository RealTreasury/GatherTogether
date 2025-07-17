# GatherTogether

Simple web app demo featuring a bingo challenge tracker, hourly verse and
placeholder live polls. The project is intentionally lightweight and uses
vanilla JavaScript without external frameworks. The bingo tracker now supports
both a regular card and a more difficult **completionist** card that can be
toggled in the interface. Completionist challenges with multiple tasks open in a
sublist view that can be dismissed via the close button, clicking outside the
list or pressing <kbd>Esc</kbd>. For sublists with numbered placeholders such as
"Meet people from 5 different countries," tapping a placeholder lets you enter
the actual item name so each country can be recorded individually.
Daily challenges like "Complete random acts of kindness" provide text fields so
you can jot down exactly what was done each day.
An "Invite a Friend" button lets you quickly share the site link using your
device's native share sheet or by copying the invite text to the clipboard.

## File Structure

```
GatherTogether/
├── index.html              # Main HTML structure
├── styles/
│   └── global.css          # All styling
├── scripts/
│   ├── app.js              # Main app initialization
│   ├── bingo.js            # Bingo tracker functionality
│   ├── verse.js            # Bible verse management
│   ├── polls.js            # Polls and Q&A
│   ├── storage.js          # Local storage utilities
│   └── utils.js            # Utility functions
└── README.md               # Documentation
```

## Running the server

### Firebase backend

Polls and leaderboard data are now stored in Firebase. Run the Node service
inside `gathertogether-backend/` to expose the required API:

```bash
cd gathertogether-backend
npm install
npm start
```

The backend listens on `http://localhost:3001` by default. For local
development provide a Firebase service account file at
`gathertogether-backend/config/serviceAccountKey.json`. In production you can
set environment variables such as `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY`
and `FIREBASE_CLIENT_EMAIL` instead.

### Google Sheets backend (optional)

If you prefer not to use Firebase, set `GOOGLE_SHEETS_ID`,
`GOOGLE_SHEETS_CLIENT_EMAIL` and `GOOGLE_SHEETS_PRIVATE_KEY` when starting the
backend. When these variables are present the server stores leaderboard rows in
a Google Sheet using the Sheets API. Install dependencies in the backend folder
with `npm install` before running.

### Local server.js (optional)

The original `server.js` at the repository root stores data in JSON files and
mirrors the same API routes. It can still be run for offline testing but is not
required when using the Firebase backend. To start it:

```bash
npm install
npm start
```

The local server will serve the app at `http://localhost:3000` and expose the
`/api/polls`, `/api/bingo/leaderboard` and `/api/users` endpoints. The
`/api/users` route lets you save simple profile information (user ID,
username and email) to `data/users.json`.

### Hosting on WordPress

If you only have static hosting such as a WordPress.com site, deploy the
frontend files (`index.html`, `styles/`, `scripts/`) to your WordPress media
library or theme and embed the page via `<iframe>`:

```html
<iframe src="https://your-node-backend.example.com/index.html" width="100%" height="800"></iframe>
```

Run the Node server on a separate host (e.g. Render or Fly.io) and set the
`FRONTEND_URL` environment variable so CORS allows your WordPress domain.

## Running Tests

Install dependencies and run the test suite with npm:

```bash
npm install
npm test
```

Tests are automatically executed for every push and pull request through
GitHub Actions.

## Legal

Standalone pages [`terms.html`](terms.html) and [`privacy.html`](privacy.html) outline the demo
Terms of Service and Privacy Policy.

