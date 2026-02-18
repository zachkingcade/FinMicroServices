# Transactions Service

HTTP service for ledger and pending transactions. Uses SQLite for persistence and calls the accounts service for account validation and details.

## Quick start

- **Prerequisites**: Node.js; 
- accounts service running (default `http://localhost:3001`)
- Install: `npm install`
- Run: `npm start` — compiles TypeScript and starts the server (listens on port **3002** by default).
- Tests: `npm test` — run the test suite.
- Fresh start: `npm run fresh-start` — removes the database and starts the service.  
  `npm run fresh-start-clear-logs` — same plus clears the `./logs` directory.

## Configuration

Configuration is read from **`config.json`** in this project’s root (e.g. `transactions-service/config.json`). You can copy **`config.example.json`** to `config.json` and adjust as needed. If `config.json` is missing or invalid, the service uses built-in defaults and continues (a warning is logged).

| Option               | Default                             | Description                                |
|----------------------|-------------------------------------|--------------------------------------------|
| `port`               | `3002`                              | HTTP listen port.                          |
| `host`               | `"0.0.0.0"`                         | Bind address for the HTTP server.          |
| `databasePath`       | `"./TransactionsServiceDatabase.db"`| Path to the SQLite database file.          |
| `accountsServiceUrl` | `"http://localhost:3001"`           | Base URL of the accounts service.          |

Optional: set **`CONFIG_PATH`** (absolute or relative to the current working directory) to use a config file at a different path.
