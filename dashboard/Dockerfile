FROM oven/bun:1 AS base
WORKDIR /app

COPY dashboard/ ./dashboard/

WORKDIR /app/dashboard

RUN bun install

EXPOSE 5173

# Development only — production build handled by nginx/Dockerfile
CMD ["bun", "run", "dev"]
