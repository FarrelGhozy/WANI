FROM oven/bun:1 AS base
WORKDIR /app

# Copy api + web-gen (api imports web-gen via relative path at runtime)
COPY api/ ./api/
COPY web-gen/ ./web-gen/

WORKDIR /app/api

RUN bun install
RUN bunx prisma generate

EXPOSE 3001

COPY api/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint.sh"]
