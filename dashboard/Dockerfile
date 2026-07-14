FROM oven/bun:1-alpine AS build
WORKDIR /app

COPY dashboard/package.json dashboard/bun.lock ./
RUN bun install

COPY dashboard/ ./
COPY landingpage/ ../landingpage/

ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}
RUN bun run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY dashboard/default.conf /etc/nginx/conf.d/default.conf
COPY dashboard/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
EXPOSE 80
ENTRYPOINT ["/docker-entrypoint.sh"]
