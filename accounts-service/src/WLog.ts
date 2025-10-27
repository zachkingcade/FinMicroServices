import { createLogger, format, Logger, transports } from 'winston'
import 'winston-daily-rotate-file';

export class WLog {
  private static loggerInstance: Logger;

  static getLogger(): Logger {
    if (this.loggerInstance != null) {
      return this.loggerInstance
    } else {
      this.loggerInstance = createLogger({
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
      return this.loggerInstance;
    }
  }
}
