FROM node:20-slim AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc ./
COPY packages/ packages/
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile
COPY apps/web/ apps/web/
RUN pnpm --filter web build

FROM nginx:alpine AS runner
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
