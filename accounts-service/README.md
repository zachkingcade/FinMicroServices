# Accounts Service

HTTP service for handeling accounts, account types, account budgets and account planning. Uses SQLite for persistence.

## Quick start

- **Prerequisites**: Node.js.
- Install: `npm install`
- Run: `npm start` — compiles TypeScript and starts the server (listens on port **3001** by default).
- Tests: `npm test` — runs unit tests (removes the test DB first).
- Fresh start: `npm run fresh-start` — removes the database and starts the service.  
  `npm run fresh-start-clear-logs` — same plus clears the `./logs` directory.

## Configuration

Configuration is read from **`config.json`** in this project’s root (e.g. `accounts-service/config.json`). You can copy **`config.example.json`** to `config.json` and adjust as needed. If `config.json` is missing or invalid, the service uses built-in defaults and continues (a warning is logged).

| Option         | Default                         | Description                          |
|----------------|----------------------------------|--------------------------------------|
| `port`         | `3001`                           | HTTP listen port.                    |
| `host`         | `"0.0.0.0"`                      | Bind address for the HTTP server.    |
| `databasePath` | `"./AccountsServiceDatabase.db"` | Path to the SQLite database file.   |

Optional: set **`CONFIG_PATH`** (absolute or relative to the current working directory) to use a config file at a different path.
