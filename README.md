# GatherTogether

Simple web app demo featuring a bingo challenge tracker, hourly verse and
placeholder live polls. The project is intentionally lightweight and uses
vanilla JavaScript without external frameworks. The bingo tracker now supports
both a regular card and a more difficult **completionist** card that can be
toggled in the interface. Completionist challenges with multiple tasks open in a
sublist view that can be dismissed via the close button, clicking outside the
list or pressing <kbd>Esc</kbd>.
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

### Local server.js (optional)

The original `server.js` at the repository root stores data in JSON files and
mirrors the same API routes. It can still be run for offline testing but is not
required when using the Firebase backend. To start it:

```bash
npm install
npm start
```

The local server will serve the app at `http://localhost:3000` and expose the
`/api/polls` and `/api/bingo/leaderboard` endpoints.

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

