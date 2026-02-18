# Fin User Interface Service

Angular SPA and Node logger server for the Fin microservices stack. The app proxies API and log requests to the accounts, transactions, and logger backends.

## Quick start

- **Prerequisites**: Node.js; for full functionality, run the **accounts service** (default port 3001) and **transactions service** (default port 3002) as well.
- Install: `npm install`
- **Client only**: `npm run start:client` (or `ng serve`) — Angular dev server (default port 4200).  
  `npm run start:client:local` — same with `--host 0.0.0.0 --port 4200`.
- **Logger only**: `npm run start:logger` — Node logger server (default port 3003).
- **Both**: `npm start` — runs client and logger concurrently.  
  `npm run start:local` — client and logger with client bound to 0.0.0.0.
- Tests: `npm test` — run unit tests.
- Build: `npm run build` — production build.

The app proxies to **accounts** (3001), **transactions** (3002), and **logger** (3003). If you change those ports in their respective configs, you must update **`proxy.conf.json`** so the proxy targets match.

## Configuration

Configuration is read from **`config.json`** in this project’s root (e.g. `fin-user-interface-service/config.json`). You can copy **`config.example.json`** to `config.json` and adjust as needed. If `config.json` is missing or invalid, built-in defaults are used.

| Option | Default | Description |
|--------|---------|-------------|
| `devServer.port` | `4200` | Angular dev server port (documented; override via `ng serve --port X` if needed). |
| `devServer.host` | `"localhost"` | Angular dev server host (documented; override via `ng serve --host Y` if needed). |
| `loggerServer.port` | `3003` | Logger server listen port. |
| `loggerServer.host` | `"0.0.0.0"` | Logger server bind address. |

Optional: set **`CONFIG_PATH`** (absolute or relative to the current working directory) to use a config file at a different path.

**Proxy**: The dev server uses **`proxy.conf.json`** to forward `/account`, `/budget`, `/type`, `/transaction`, `/playbook`, and `/logs` to the backends. If you change the accounts, transactions, or logger ports in their configs, update the corresponding `target` URLs in `proxy.conf.json` (e.g. `http://localhost:3001`, `http://localhost:3002`, `http://localhost:3003`) so they match.
