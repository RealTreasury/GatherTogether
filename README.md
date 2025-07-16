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

The polls feature relies on a small Node.js API. Install dependencies and start
the server:

```bash
npm install
node server.js
```

The app will be available at `http://localhost:3000` and the polls API can be
reached at `http://localhost:3000/api/polls`.

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

