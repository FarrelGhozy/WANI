FROM oven/bun:1 AS base
WORKDIR /app

COPY dashboard/ ./dashboard/

WORKDIR /app/dashboard

RUN bun install

EXPOSE 5173

# VITE_API_URL defaults to http://api:3001 in Compose
CMD ["bun", "run", "dev"]
