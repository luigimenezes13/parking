# Setup do Projeto — Comandos Executados

Este documento registra todos os comandos executados para montar o projeto do zero, servindo como referencia para reproduzir o ambiente.

## 1. Inicializacao

```bash
# Criar package.json com type module e scripts
# (arquivo criado manualmente — ver package.json)

# Instalar dependencias de producao
pnpm add fastify @fastify/cors @fastify/swagger @fastify/swagger-ui \
  inversify reflect-metadata \
  kysely pg @prisma/client \
  zod zod-to-json-schema \
  tsup @tsconfig/node20

# Instalar dependencias de desenvolvimento
pnpm add -D typescript tsx nodemon \
  vitest @vitest/coverage-v8 @vitest/ui \
  prisma prisma-kysely @types/pg \
  eslint @eslint/js @eslint/eslintrc \
  @typescript-eslint/eslint-plugin @typescript-eslint/parser \
  eslint-config-prettier eslint-plugin-prettier prettier globals \
  vite-tsconfig-paths @swc/core
```

## 2. Estrutura de pastas

```bash
mkdir -p \
  src/domain/shared/value-objects \
  src/domain/shared/errors \
  src/domain/shared/events \
  src/app/shared \
  src/app/dto \
  src/app/usecases \
  src/app/services \
  src/app/mappers \
  src/app/exceptions \
  src/app/events \
  src/app/tests/in-memory-repositories \
  src/app/tests/factories \
  src/infra/server \
  src/infra/di \
  src/infra/env \
  src/infra/controllers \
  src/infra/database/prisma/migrations \
  src/infra/database/kysely/mappers \
  src/infra/database/types
```

## 3. Configuracoes criadas

| Arquivo | Descricao |
|---|---|
| `tsconfig.json` | TypeScript strict, ESM (NodeNext), decorators, path aliases (`@domain/*`, `@app/*`, `@infra/*`) |
| `eslint.config.mjs` | ESLint flat config + TypeScript + Prettier + plugin DDD customizado |
| `eslint-ddd-plugin.mjs` | Plugin ESLint que enforces separacao de camadas (domain !-> app/infra, app !-> infra) |
| `.prettierrc` | Single quotes, trailing commas, semi, 100 print width |
| `vitest.config.ts` | Vitest com globals, coverage v8, exclui `src/infra/**` do coverage |
| `docker-compose.yml` | PostgreSQL 16 Alpine |
| `.env.example` | Template de variaveis de ambiente |
| `.gitignore` | dist, node_modules, coverage, .env, logs, .prisma |

## 4. Prisma + Kysely

```bash
# Schema inicial criado em src/infra/database/prisma/schema.prisma
# Com generators: prisma-client-js + prisma-kysely

# Gerar client e tipos Kysely
pnpm generate

# Criar e rodar migrations
pnpm migrate
```

## 5. Validacao

```bash
# Checar tipos
pnpm typecheck

# Validar container Inversify
pnpm test:di

# Build de producao (ESM via tsup)
pnpm build
```

## 6. Rodar o projeto

```bash
# Subir banco
docker compose up -d

# Copiar env
cp .env.example .env

# Migrations
pnpm migrate

# Gerar tipos
pnpm generate

# Desenvolvimento
pnpm dev
```
