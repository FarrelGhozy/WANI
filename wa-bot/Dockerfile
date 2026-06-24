FROM oven/bun:1 AS base
WORKDIR /app

COPY wa-bot/ ./wa-bot/

WORKDIR /app/wa-bot

RUN bun install
RUN bunx prisma generate

COPY wa-bot/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint.sh"]
