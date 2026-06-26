FROM oven/bun:1-alpine
WORKDIR /app

COPY api/ ./api/
RUN cd api && bun install && DATABASE_URL="postgresql://dummy:dummy@db:5432/wani_api" bunx prisma generate
COPY web-gen/ ./web-gen/
RUN cd web-gen && bun install

COPY api/docker-entrypoint.sh /
RUN chmod +x /docker-entrypoint.sh

EXPOSE 3001
ENTRYPOINT ["/docker-entrypoint.sh"]
