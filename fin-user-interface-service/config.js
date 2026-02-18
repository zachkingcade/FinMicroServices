/**
 * Loads config from config.json in the project root (fin-user-interface-service).
 * If the file is missing or unreadable, built-in defaults are used.
 * Optional: set CONFIG_PATH to use a different config file path.
 */

import fs from 'fs';
import path from 'path';

const DEFAULTS = {
  devServer: { port: 4200, host: 'localhost' },
  loggerServer: { port: 3003, host: '0.0.0.0' },
};

function loadRaw() {
  const configPath = process.env.CONFIG_PATH
    ? path.resolve(process.env.CONFIG_PATH)
    : path.join(process.cwd(), 'config.json');
  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf-8');
      return JSON.parse(data);
    }
  } catch {
    /* use defaults */
  }
  return {};
}

export function getConfig() {
  const raw = loadRaw();
  return {
    devServer: {
      port: typeof raw.devServer?.port === 'number' ? raw.devServer.port : DEFAULTS.devServer.port,
      host: typeof raw.devServer?.host === 'string' ? raw.devServer.host : DEFAULTS.devServer.host,
    },
    loggerServer: {
      port: typeof raw.loggerServer?.port === 'number' ? raw.loggerServer.port : DEFAULTS.loggerServer.port,
      host: typeof raw.loggerServer?.host === 'string' ? raw.loggerServer.host : DEFAULTS.loggerServer.host,
    },
  };
}
