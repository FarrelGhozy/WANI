FROM oven/bun:1-alpine AS build
WORKDIR /app

COPY dashboard/package.json dashboard/bun.lock ./
RUN bun install

COPY dashboard/ ./

RUN bun run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
