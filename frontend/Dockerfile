FROM node:22.23-alpine AS builder
WORKDIR /app

# Corepack installs the pnpm version pinned by "packageManager" in package.json, so the
# image builds with the same pnpm as the developers and CI, never whatever is newest.
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

# pnpm-workspace.yaml contains allowBuilds: esbuild, otherwise pnpm 12 refuses
# to run postinstall scripts in CI until they are approved interactively.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM nginx:1.31-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
# A template, not a final conf: the nginx entrypoint substitutes ${UMAMI_WEBSITE_ID}
# (and only defined env vars) before writing conf.d/default.conf.
COPY nginx.conf /etc/nginx/templates/default.conf.template

EXPOSE 80
