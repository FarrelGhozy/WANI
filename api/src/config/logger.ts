import winston from "winston"

const isProd = process.env.NODE_ENV === "production"

const { colorize, timestamp, printf, combine, errors, json } = winston.format

const devFormat = combine(
  timestamp({ format: "HH:mm:ss" }),
  colorize(),
  errors({ stack: true }),
  printf(({ timestamp, level, message, stack, http: _http, ...meta }) => {
    const ts = timestamp as string
    let line = `${ts}  ${level} ${message as string}`
    if (stack) line += `\n${stack as string}`
    for (const [k, v] of Object.entries(meta)) {
      if (typeof v === "string" || typeof v === "number") {
        line += `\n  ${k}: ${v}`
      }
    }
    return line
  }),
)

const prodFormat = combine(timestamp(), errors({ stack: true }), json())

export const logger = winston.createLogger({
  level: "info",
  format: isProd ? prodFormat : devFormat,
  transports: [new winston.transports.Console()],
})

export const morganStream = {
  write(message: string) {
    logger.info(message.trim(), { http: true })
  },
}
