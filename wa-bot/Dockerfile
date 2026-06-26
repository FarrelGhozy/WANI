FROM oven/bun:1 AS base

FROM base AS build
WORKDIR /app/wa-bot

COPY wa-bot/package.json wa-bot/bun.lock wa-bot/tsconfig.json wa-bot/prisma.config.ts ./
COPY wa-bot/prisma/ ./prisma/

RUN bun install --frozen-lockfile --production
RUN DATABASE_URL="postgresql://dummy:dummy@db:5432/wa_bot" bunx prisma generate

COPY wa-bot/ ./

RUN bun build ./src/index.ts --target=bun --outfile=./dist/index.js --external link-preview-js --external jimp --external sharp --external @whiskeysockets/baileys

FROM base AS runner
WORKDIR /app

COPY --from=build /app/wa-bot/package.json ./
COPY --from=build /app/wa-bot/node_modules ./node_modules
COPY --from=build /app/wa-bot/dist ./dist
COPY --from=build /app/wa-bot/prisma ./prisma
COPY --from=build /app/wa-bot/prisma.config.ts ./
COPY --from=build /app/wa-bot/docker-entrypoint.sh /
COPY --from=build /app/wa-bot/generated ./generated

RUN chmod +x /docker-entrypoint.sh

EXPOSE 3001
ENTRYPOINT ["/docker-entrypoint.sh"]
