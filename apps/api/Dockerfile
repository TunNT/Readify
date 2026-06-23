FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/database/package.json packages/database/package.json
RUN pnpm install --filter @wearenovelark/api... --filter @wearenovelark/database... --frozen-lockfile

FROM deps AS build
RUN apk add --no-cache openssl
COPY apps/api apps/api
COPY packages/database packages/database
RUN pnpm --filter @wearenovelark/database prisma:generate
RUN pnpm --filter @wearenovelark/api build

FROM base AS runner
ENV NODE_ENV=production
RUN apk add --no-cache openssl
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /app/packages/database/node_modules ./packages/database/node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/packages/database ./packages/database
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
WORKDIR /app/apps/api
EXPOSE 4000
CMD ["node", "dist/main.js"]
