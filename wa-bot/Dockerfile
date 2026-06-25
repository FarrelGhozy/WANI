FROM oven/bun:1 AS build
WORKDIR /app/wa-bot

COPY wa-bot/package.json wa-bot/bun.lock ./
RUN bun install

COPY wa-bot/prisma/ ./prisma/
RUN bunx prisma generate

COPY wa-bot/ ./

RUN bun run build

FROM oven/bun:1
WORKDIR /app

# COPY --from=build /app/wa-bot/dist ./dist
# COPY --from=build /app/wa-bot/prisma ./prisma
# COPY --from=build /app/wa-bot/prisma.config.ts ./
# COPY --from=build /app/wa-bot/docker-entrypoint.sh /

COPY --from=build /app/api/dist ./dist
COPY --from=build /app/api/prisma ./prisma
COPY --from=build /app/api/prisma.config.ts ./
COPY --from=build /app/api/docker-entrypoint.sh /
COPY --from=build /app/api/package.json ./package.json

# Copy the generated prisma client files from the build stage to the final image
COPY --from=build /app/api/generated ./generated

RUN chmod +x /docker-entrypoint.sh

EXPOSE 3001
ENTRYPOINT ["/docker-entrypoint.sh"]
