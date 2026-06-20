FROM node:24-alpine AS base
WORKDIR /app

FROM base AS prepare
COPY . .
RUN npx --yes turbo@2.5.4 prune @url-shortener/frontend --docker

FROM base AS deps
COPY --from=prepare /app/out/json/ .
RUN npm ci

FROM base AS build
COPY --from=prepare /app/out/json/ .
COPY --from=prepare /app/out/full/ .
COPY --from=deps /app/node_modules ./node_modules
ARG VITE_API_URL=/api
ARG VITE_PUBLIC_BASE_URL
ARG VITE_TURNSTILE_SITE_KEY
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_PUBLIC_BASE_URL=$VITE_PUBLIC_BASE_URL
ENV VITE_TURNSTILE_SITE_KEY=$VITE_TURNSTILE_SITE_KEY
RUN npx --yes turbo@2.5.4 run build --filter=@url-shortener/frontend

FROM nginx:latest AS runtime
COPY --from=build /app/apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/frontend/dist /usr/share/nginx/html
EXPOSE 80
