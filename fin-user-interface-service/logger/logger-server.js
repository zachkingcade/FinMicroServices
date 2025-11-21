// server/logger-server.js
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createLogger, format, Logger, transports } from 'winston'
import 'winston-daily-rotate-file';

const app = express();
const PORT = 3003; // Node logger port

// Make sure logs folder exists
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Winston logger setup
const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    format.prettyPrint(),
    format.printf(({ level, message, timestamp }) => { return `${timestamp} ${level}: ${message}`; })
  ),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize()
      )
    }),
    new transports.DailyRotateFile({
      level: 'debug',
      filename: './logs/accountsService-%DATE%.all.log',
      datePattern: 'YYMMDD',
      zippedArchive: true,
      maxSize: '20m',
    }),
    new transports.DailyRotateFile({
      level: 'warn',
      filename: './logs/accountsService-%DATE%.error.log',
      datePattern: 'YYMMDD',
      zippedArchive: true,
      maxSize: '20m',
    }),
  ]
})

// Middleware
app.use(cors());
app.use(express.json());

// Simple health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Endpoint Angular will hit
app.post('/logs', (req, res) => {
  const body = req.body;

  if (body.level == "debug") {
    logger.debug(body.message);
  } else if (body.level == "info") {
    logger.info(body.message);
  } else if (body.level == "error") {
    logger.error(body.message);
  } else {
    logger.error("Message recieved with unknown level");
  }

  res.sendStatus(204);
});

app.listen(PORT, () => {
  console.log(`Logger server listening on http://localhost:${PORT}`);
});
