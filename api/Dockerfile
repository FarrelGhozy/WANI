FROM oven/bun:1-alpine AS build
WORKDIR /app/api

COPY api/package.json api/bun.lock ./
RUN bun install

COPY api/prisma/ ./prisma/
RUN bunx prisma generate

COPY api/ ./
COPY web-gen/ ../web-gen/

# Install package for the web-gen project first
# To ensure that the dependencies for the web-gen project are installed before building the api project
RUN bun install --cwd ../web-gen

# Build the api project
RUN bun run build

COPY web-gen/src/templates ./dist/templates

FROM oven/bun:1-alpine
WORKDIR /app

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
