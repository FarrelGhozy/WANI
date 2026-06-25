FROM oven/bun:1 AS builder
WORKDIR /app

COPY dashboard/ ./dashboard/
WORKDIR /app/dashboard

RUN bun install
RUN bun run build

FROM nginx:alpine
COPY --from=builder /app/dashboard/dist /usr/share/nginx/html
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
