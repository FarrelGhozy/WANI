FROM oven/bun:1-alpine
WORKDIR /app

COPY api/package.json api/bun.lock ./api/
RUN bun install --cwd api

COPY api/prisma ./api/prisma
RUN bunx prisma generate --cwd api

COPY api/ ./api/
COPY web-gen/ ./web-gen/
RUN bun install --cwd web-gen

COPY api/docker-entrypoint.sh /
RUN chmod +x /docker-entrypoint.sh

EXPOSE 3001
ENTRYPOINT ["/docker-entrypoint.sh"]
