# Parking API

API de gerenciamento de estacionamento construida com Domain-Driven Design e Clean Architecture.

## Stack

| Camada | Tecnologia |
|---|---|
| Linguagem | TypeScript |
| Runtime | Node.js 20+ |
| HTTP | Fastify 5 |
| DI | Inversify |
| Banco de dados | PostgreSQL |
| Schema & Migrations | Prisma |
| Query Builder | Kysely |
| Validacao | Zod |
| Build | tsup (ESM) |
| Testes | Vitest |
| Linter | ESLint + plugin DDD customizado |
| Package Manager | pnpm |

## Arquitetura

O projeto segue **DDD (Domain-Driven Design)** com **Clean Architecture** em tres camadas:

```
src/
├── domain/              # Regras de negocio puras — zero dependencia externa
│   └── shared/
│       ├── entity.ts
│       ├── aggregate-root.ts
│       ├── value-object.ts
│       ├── value-objects/
│       │   └── unique-identifier.ts
│       ├── events/
│       │   ├── domain-event.ts
│       │   └── domain-event-publisher.ts
│       └── errors/
│           └── domain-error.ts
│
├── app/                 # Orquestracao — use cases, DTOs, mappers
│   ├── shared/
│   │   └── use-case.ts
│   ├── dto/
│   │   └── types.ts       # Symbols Inversify (TYPES)
│   ├── usecases/
│   ├── services/
│   ├── mappers/
│   ├── events/
│   ├── exceptions/
│   └── tests/
│       ├── in-memory-repositories/
│       └── factories/
│
└── infra/               # Frameworks, drivers, adaptadores
    ├── server/
    │   └── index.ts       # Bootstrap Fastify + Swagger
    ├── di/
    │   ├── Container.ts   # Container Inversify principal
    │   ├── Repositories.ts
    │   ├── Services.ts
    │   ├── Usecases.ts
    │   ├── Controllers.ts
    │   ├── Mappers.ts
    │   └── test-di.ts     # Validacao do container
    ├── controllers/
    │   └── HealthController.ts
    ├── env/
    │   └── environment.ts # Validacao de env com Zod
    └── database/
        ├── Connection.ts  # Pool Kysely/PostgreSQL
        ├── prisma/
        │   └── schema.prisma
        ├── kysely/
        │   └── mappers/
        └── types/         # Tipos gerados pelo prisma-kysely
```

### Regras de dependencia

As dependencias sempre apontam para dentro:

```
infra → app → domain
```

- `domain/` **NAO** importa de `app/` nem de `infra/`
- `app/` **NAO** importa de `infra/`
- `infra/` pode importar de qualquer camada

Essas regras sao enforced pelo **ESLint plugin DDD** (`eslint-ddd-plugin.mjs`).

### Injecao de Dependencia

O Inversify e configurado de forma modular em `src/infra/di/`:

| Arquivo | Responsabilidade |
|---|---|
| `Container.ts` | Composicao do container |
| `Repositories.ts` | Bind de implementacoes de repositorio |
| `Services.ts` | Bind de application services |
| `Usecases.ts` | Bind de use cases |
| `Controllers.ts` | Bind de controllers HTTP |
| `Mappers.ts` | Bind de mappers de persistencia e resposta |

Os symbols de injecao ficam em `src/app/dto/types.ts`.

### Banco de Dados

- **Prisma** gerencia schema e migrations
- **prisma-kysely** gera tipos TypeScript a partir do schema Prisma
- **Kysely** e usado como query builder type-safe nos repositorios
- Tipos gerados ficam em `src/infra/database/types/types.ts`

## Setup

> Para ver todos os comandos que foram executados para montar o projeto do zero, consulte o [SETUP.md](SETUP.md).

### Pre-requisitos

- Node.js 20+
- pnpm
- Docker (para PostgreSQL)

### Instalacao

```bash
pnpm install
```

### Banco de dados

```bash
# Subir PostgreSQL
docker compose up -d

# Copiar variaveis de ambiente
cp .env.example .env

# Rodar migrations
pnpm migrate

# Gerar tipos Kysely
pnpm generate
```

### Desenvolvimento

```bash
pnpm dev
```

A API sobe em `http://localhost:3000` com documentacao Swagger em `/docs`.

### Testes

```bash
pnpm test              # Roda testes com coverage
pnpm test:watch        # Watch mode
pnpm test:ui           # Interface visual do Vitest
pnpm test:di           # Valida resolucao do container Inversify
```

### Build

```bash
pnpm build             # Gera dist/index.js (ESM via tsup)
pnpm start             # Roda em producao
```

### Qualidade

```bash
pnpm lint              # ESLint com regras DDD
pnpm lint:fix          # Auto-fix
pnpm typecheck         # Checagem de tipos
pnpm pr                # Pipeline completo: test → lint → typecheck → build
```

## Variaveis de Ambiente

| Variavel | Descricao | Default |
|---|---|---|
| `NODE_ENV` | Ambiente | `development` |
| `PORT` | Porta do servidor | `3000` |
| `DATABASE_URL` | Connection string PostgreSQL | — |
| `DB_HOST` | Host do banco | — |
| `DB_PORT` | Porta do banco | `5432` |
| `DB_NAME` | Nome do banco | — |
| `DB_USER` | Usuario do banco | — |
| `DB_PASSWORD` | Senha do banco | — |
| `DB_MAX_POOL_SIZE` | Tamanho maximo do pool | `10` |
