# GatherTogether

This demo is publicly hosted through [GitHub Pages](https://realtreasury.github.io/GatherTogether/).
It is **not** running on WordPress.com and the page is served directly rather than being embedded in an iframe. Simply visit the link above to use the
app without any additional setup. The project is intentionally lightweight and uses
vanilla JavaScript without external frameworks. The challenge tracker now supports
both a regular list and a more difficult **completionist** mode. The page starts
in this Hard Mode by default, but you can switch modes using the buttons at the
top of the challenge area. Completionist challenges with multiple tasks open in a
sublist view that can be dismissed via the close button, clicking outside the
list or pressing <kbd>Esc</kbd>. For sublists with numbered placeholders such as
"Meet people from 5 different countries," tapping a placeholder lets you enter
the actual item name so each country can be recorded individually.
An "Invite a Friend" button lets you quickly share the site link using your
device's native share sheet or by copying the invite text to the clipboard.
A "Suggest a Challenge" button in the footer opens your email client so you can
send new challenge ideas to gathertogether2025@gmail.com.

## File Structure

```
GatherTogether/
├── index.html              # Main HTML structure
├── styles/
│   └── global.css          # All styling
├── scripts/
│   ├── app.js              # Main app initialization
│   ├── bingo.js            # Challenge tracker functionality
│   ├── verse.js            # Bible verse management
│   ├── polls.js            # Polls and Q&A
│   ├── storage.js          # Local storage utilities
│   └── utils.js            # Utility functions
└── README.md               # Documentation
```

## Usage

The project is now entirely static. All data for polls and the challenge
leaderboard is stored directly in Firebase **Firestore** from the browser.
Simply open `index.html` or visit the live GitHub Pages site and the app
will connect to Firebase without any additional server setup.

Any scores recorded before Firebase initializes are queued locally and will be
automatically submitted once the connection becomes available.

If you want to use your own Firebase project, edit the `firebaseConfig`
object at the bottom of `index.html` with your project credentials.

## Legacy Node.js server (optional)

The repository still includes a small Express service under
`gathertogether-backend/` that mirrors the Firebase API. This is useful for
offline testing or if you need to proxy requests through your own backend.
It is **not** required for normal usage.

To run it locally:

```bash
cd gathertogether-backend
npm install
npm start
```

The service listens on `http://localhost:3001`. Set environment variables like
`FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY` and `FIREBASE_CLIENT_EMAIL` to
connect it to Firebase, or provide a service account file at
`gathertogether-backend/config/serviceAccountKey.json`.

### Google Sheets backend (optional)

The Node service can also write leaderboard entries to Google Sheets. Set
`GOOGLE_SHEETS_ID`, `GOOGLE_SHEETS_CLIENT_EMAIL` and
`GOOGLE_SHEETS_PRIVATE_KEY` before starting the server and any submitted scores
will be written to the specified spreadsheet.

### Local server.js (optional)

The legacy `server.js` at the repository root stores everything in local JSON
files. It's handy for quick demos without Firebase but is no longer maintained.
To try it anyway:

```bash
npm install
npm start
```

The local server will serve the app at `http://localhost:3000` and expose the
`/api/polls`, `/api/bingo/leaderboard` and `/api/users` endpoints. The
`/api/users` route lets you save simple profile information (user ID,
username and email) to `data/users.json`.

### Embedding in WordPress (optional)

The official app runs from GitHub Pages and does **not** require WordPress or any iframe.
If you wish to integrate it into a WordPress.com site, deploy the frontend
files (`index.html`, `styles/`, `scripts/`) to your media library or theme and
embed the page via `<iframe>`:

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

## Cache Busting

When updating any scripts or styles hosted on GitHub Pages you can force
visitors to download the new versions by appending a query parameter to the
file URLs in `index.html`:

```html
<link href="styles/global.css?v=11" rel="stylesheet">
<script src="scripts/app.js?v=11"></script>
```

Increase the version number whenever you deploy new assets so browsers do not
use stale cached files. Always remember to bump the version query parameter in
`index.html` whenever you change any scripts or styles so visitors receive the
latest files.

## Legal

Standalone pages [`terms.html`](terms.html) and [`privacy.html`](privacy.html) outline the demo
Terms of Service and Privacy Policy.

