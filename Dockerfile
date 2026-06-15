# ─── Build stage ───────────────────────────────────────────
FROM node:22-alpine AS builder

RUN apk add --no-cache python3 make g++ openssl-dev

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY prisma/ ./prisma/
RUN npx prisma generate

COPY tsconfig.json ./
COPY src/ ./src/
RUN npx tsc --outDir dist

# ─── Production stage ─────────────────────────────────────
FROM node:22-alpine AS runner

RUN apk add --no-cache tini openssl

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY prisma/ ./prisma/
COPY --from=builder /app/dist ./dist

EXPOSE 3000
ENV NODE_ENV=production

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/server.js"]
