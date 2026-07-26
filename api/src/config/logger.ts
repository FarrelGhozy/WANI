import winston from "winston";

const isProd = process.env.NODE_ENV === "production";

const { timestamp, printf, combine, errors, json, label } = winston.format;

const LEVEL_COLOR: Record<string, string> = {
  error: "\x1b[1;31m",
  warn: "\x1b[1;33m",
  info: "\x1b[1;34m",
  debug: "\x1b[1;36m",
};
const RESET = "\x1b[0m";

const devFormat = combine(
  timestamp({ format: "HH:mm:ss" }),
  label({ label: "wani-api" }),
  errors({ stack: true }),
  printf(({ timestamp, level, message, label, stack, ...meta }) => {
    const color = LEVEL_COLOR[level] ?? "";
    const level_custom = `${color}${level.toUpperCase()}${RESET}`;
    let line = `[\x1b[1;33m${timestamp}\x1b[0m] \x1b[1;3;34m${label}\x1b[0m [${level_custom}] => ${message as string}`;

    if (stack) line += `\n${stack as string}`;

    for (const [k, v] of Object.entries(meta)) {
      if (typeof v === "string" || typeof v === "number") {
        line += `\n  ${k}: ${v}`;
      }
    }

    return line;
  })
);

const prodFormat = combine(timestamp(), errors({ stack: true }), json());

export const logger = winston.createLogger({
  level: "info",
  format: isProd ? prodFormat : devFormat,
  transports: [new winston.transports.Console()],
});

export const morganStream = {
  write(message: string) {
    logger.info(message.trim(), { http: true });
  },
};
