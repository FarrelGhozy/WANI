FROM oven/bun:1 AS base

FROM base AS build
WORKDIR /app/api

COPY api/package.json api/bun.lock api/tsconfig.json api/prisma.config.ts ./
COPY api/ ./

RUN bun install --frozen-lockfile

# Build web-gen dependencies
COPY web-gen/package.json web-gen/bun.lock /app/web-gen/
RUN cd /app/web-gen && bun install --frozen-lockfile --production

COPY web-gen/ /app/web-gen/

RUN DATABASE_URL="postgresql://dummy:dummy@db:5432/wani_api" bun prisma generate

# Pre-build fonts + Tailwind CSS for web-gen templates
RUN cd /app/web-gen && bun run src/build-fonts.ts && bun run src/build-css.ts

RUN bun build ./src/index.ts --target=bun --outfile=./dist/index.js

FROM base AS runner
WORKDIR /app

COPY --from=build /app/api/package.json ./
COPY --from=build /app/api/node_modules ./node_modules
COPY --from=build /app/api/dist ./dist
COPY --from=build /app/api/prisma ./prisma
COPY --from=build /app/api/prisma.config.ts ./
COPY --from=build /app/api/docker-entrypoint.sh /
COPY --from=build /app/api/generated ./generated
COPY --from=build /app/web-gen/src/templates ./dist/templates

RUN chmod +x /docker-entrypoint.sh

EXPOSE 3001
ENTRYPOINT ["/docker-entrypoint.sh"]
