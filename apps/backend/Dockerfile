FROM node:24-alpine AS base
WORKDIR /app

FROM base AS prepare
COPY . .
RUN npx --yes turbo@2.5.4 prune @url-shortener/backend --docker

FROM base AS deps
COPY --from=prepare /app/out/json/ .
RUN npm ci

FROM base AS build
COPY --from=prepare /app/out/json/ .
COPY --from=prepare /app/out/full/ .
COPY --from=deps /app/node_modules ./node_modules
RUN npx --yes turbo@2.5.4 run build --filter=@url-shortener/backend

FROM base AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/backend/package.json ./apps/backend/package.json
COPY --from=build /app/apps/backend/dist ./apps/backend/dist
WORKDIR /app/apps/backend
USER node
EXPOSE 3000
CMD ["node", "dist/main"]
