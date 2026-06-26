FROM oven/bun:1-alpine AS build
WORKDIR /app/wa-bot

COPY wa-bot/package.json wa-bot/bun.lock ./
RUN bun install

COPY wa-bot/prisma/ ./prisma/
RUN bunx prisma generate

COPY wa-bot/ ./

RUN bun run build

FROM oven/bun:1-alpine
WORKDIR /app

# Install production dependencies
COPY --from=build /app/wa-bot/package.json ./package.json
COPY --from=build /app/wa-bot/bun.lock ./bun.lock
RUN bun install --production

# Copy the built app files from the build stage to the final image
COPY --from=build /app/wa-bot/dist ./dist
COPY --from=build /app/wa-bot/prisma ./prisma
COPY --from=build /app/wa-bot/prisma.config.ts ./
COPY --from=build /app/wa-bot/docker-entrypoint.sh /

# Copy the generated prisma client files from the build stage to the final image
COPY --from=build /app/wa-bot/generated ./generated

RUN chmod +x /docker-entrypoint.sh

EXPOSE 3001
ENTRYPOINT ["/docker-entrypoint.sh"]
