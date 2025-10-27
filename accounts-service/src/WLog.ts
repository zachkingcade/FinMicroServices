import { createLogger, format, Logger, transports } from 'winston'

export class WLog {
  loggerInstance!: Logger

  getLogger () {
    if (this.loggerInstance != null) {
      return this.loggerInstance
    } else {
      this.loggerInstance = createLogger({
        level: 'info',
        format: format.combine(format.colorize(), format.simple()),
        transports: [new transports.Console()]
      })
    }
  }
}
