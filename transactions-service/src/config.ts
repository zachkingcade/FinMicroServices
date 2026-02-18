import * as fs from 'fs';
import * as path from 'path';

/**
 * This service reads its config from config.json in the project root.
 * If the file is missing or unreadable, built-in defaults are used so the service still starts.
 */

export interface TransactionsServiceConfig {
  port: number;
  host: string;
  databasePath: string;
  accountsServiceUrl: string;
}

const DEFAULTS: TransactionsServiceConfig = {
  port: 3002,
  host: '0.0.0.0',
  databasePath: './TransactionsServiceDatabase.db',
  accountsServiceUrl: 'http://localhost:3001',
};

function loadRaw(): { data: Record<string, unknown>; found: boolean } {
  const configPath = process.env.CONFIG_PATH
    ? path.resolve(process.env.CONFIG_PATH)
    : path.join(process.cwd(), 'config.json');
  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf-8');
      return { data: JSON.parse(data) as Record<string, unknown>, found: true };
    }
  } catch {
    /* use defaults */
  }
  return { data: {}, found: false };
}

export function loadConfig(): { config: TransactionsServiceConfig; found: boolean } {
  const { data: raw, found } = loadRaw();
  const config: TransactionsServiceConfig = {
    port: typeof raw.port === 'number' ? raw.port : DEFAULTS.port,
    host: typeof raw.host === 'string' ? raw.host : DEFAULTS.host,
    databasePath: typeof raw.databasePath === 'string' ? raw.databasePath : DEFAULTS.databasePath,
    accountsServiceUrl: typeof raw.accountsServiceUrl === 'string' ? raw.accountsServiceUrl : DEFAULTS.accountsServiceUrl,
  };
  return { config, found };
}
