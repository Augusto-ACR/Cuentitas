FROM node:20-slim AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc ./
COPY packages/ packages/
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile
COPY apps/api/ apps/api/
RUN pnpm --filter api build

FROM node:20-slim AS runner
WORKDIR /app
RUN npm install -g pnpm
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc ./
COPY packages/ packages/
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile --prod
COPY --from=builder /app/apps/api/dist apps/api/dist
COPY apps/api/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
EXPOSE 3000
ENTRYPOINT ["/entrypoint.sh"]
