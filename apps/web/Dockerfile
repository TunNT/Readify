FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/database/package.json packages/database/package.json
RUN pnpm install --filter @wearenovelark/web... --frozen-lockfile

FROM deps AS build
ARG NEXT_PUBLIC_API_URL=/api
ARG INTERNAL_API_URL=http://api:4000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV INTERNAL_API_URL=$INTERNAL_API_URL
COPY apps/web apps/web
RUN pnpm --filter @wearenovelark/web build

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_PUBLIC_API_URL=/api
ENV INTERNAL_API_URL=http://api:4000
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=build /app/apps/web/.next ./apps/web/.next
COPY --from=build /app/apps/web/package.json ./apps/web/package.json
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
WORKDIR /app/apps/web
EXPOSE 3000
CMD ["pnpm", "start"]
