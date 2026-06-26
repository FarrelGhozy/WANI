FROM oven/bun:1-alpine AS dashboard-build
WORKDIR /app

COPY dashboard/package.json dashboard/bun.lock ./
RUN bun install

COPY dashboard/ ./
RUN bun run build

FROM nginx:alpine
COPY --from=dashboard-build /app/dist /usr/share/nginx/html
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
