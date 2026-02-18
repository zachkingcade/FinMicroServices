import * as fs from 'fs';
import * as path from 'path';

/**
 * This service reads its config from config.json in the project root.
 * If the file is missing or unreadable, built-in defaults are used so the service still starts.
 */

export interface AccountsServiceConfig {
  port: number;
  host: string;
  databasePath: string;
}

const DEFAULTS: AccountsServiceConfig = {
  port: 3001,
  host: '0.0.0.0',
  databasePath: './AccountsServiceDatabase.db',
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

export function loadConfig(): { config: AccountsServiceConfig; found: boolean } {
  const { data: raw, found } = loadRaw();
  const config: AccountsServiceConfig = {
    port: typeof raw.port === 'number' ? raw.port : DEFAULTS.port,
    host: typeof raw.host === 'string' ? raw.host : DEFAULTS.host,
    databasePath: typeof raw.databasePath === 'string' ? raw.databasePath : DEFAULTS.databasePath,
  };
  return { config, found };
}
