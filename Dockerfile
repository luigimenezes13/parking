# syntax=docker/dockerfile:1

############################
# Build stage
############################
FROM node:20-slim AS build

# prisma.config.ts lanca erro se DATABASE_URL faltar (mesmo no `prisma generate`,
# que nao conecta). Um valor dummy satisfaz a validacao em tempo de build.
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build \
    PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH

# OpenSSL e exigido pelos engines do Prisma.
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable

WORKDIR /app

# Manifestos primeiro: maximiza cache da camada de dependencias.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack prepare pnpm@10.10.0 --activate \
    && pnpm install --frozen-lockfile

# Codigo, geracao do client Prisma + tipos Kysely, e bundle de producao.
COPY . .
RUN pnpm generate \
    && pnpm build

############################
# Runtime stage
############################
FROM node:20-slim AS runtime

ENV NODE_ENV=production

# OpenSSL para o engine de migracao do Prisma em runtime.
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# node_modules ja traz o client Prisma gerado e o CLI (para migrate deploy);
# dist e o bundle; prisma.config.ts + schema + migrations alimentam o migrate.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY --from=build /app/src/infra/database/prisma ./src/infra/database/prisma
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Railway injeta PORT em runtime; 3000 e o default do app.
EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
