import winston from "winston"

const { colorize, timestamp, printf, combine, errors } = winston.format

const format = combine(
  timestamp({ format: "HH:mm:ss" }),
  colorize(),
  errors({ stack: true }),
  printf(({ timestamp, level, message, stack, ...meta }) => {
    const ts = timestamp as string
    const http = meta.http as string | undefined
    if (http) {
      return `${ts}  ${level} ${http}`
    }
    let line = `${ts}  ${level} ${message as string}`
    if (stack) line += `\n${stack as string}`
    return line
  }),
)

export const logger = winston.createLogger({
  level: "info",
  format,
  transports: [new winston.transports.Console()],
})

export const morganStream = {
  write(message: string) {
    logger.info(message.trim(), { http: true })
  },
}
