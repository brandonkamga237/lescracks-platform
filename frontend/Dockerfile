FROM node:22-alpine AS builder
WORKDIR /app

# pnpm is the package manager used in the project; package-lock.json does not exist.
RUN corepack enable && corepack prepare pnpm@latest --activate

# pnpm-workspace.yaml contains allowBuilds: esbuild, otherwise pnpm 12 refuses
# to run postinstall scripts in CI until they are approved interactively.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
