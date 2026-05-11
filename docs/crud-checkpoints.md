# CRUD HTTP — Checkpoints de Implementacao

> **Escopo:** entrega do CRUD HTTP completo para Driver, ParkingLot, Vehicle, ParkingSpot e ParkingSession, mais o endpoint de Mapa dinamico. Coexiste com o fluxo de eventos RabbitMQ documentado em [sprint-5-events-flow.md](./sprint-5-events-flow.md).

---

## Contexto

A API tinha o dominio modelado, schema Prisma, repositorios Kysely, mappers, RabbitMQ + handlers de reconhecimento, e error handler — mas nenhum endpoint HTTP de CRUD. O trabalho desta entrega foi:

- Construir a **camada admin/management** via HTTP CRUD em todas as entidades.
- Manter o **fluxo operacional via eventos** (RabbitMQ → app-services) intacto. Os dois caminhos coexistem.
- Adicionar **soft delete** em Driver, Vehicle, ParkingLot, ParkingSpot.
- Adicionar **campos posicionais** (`row`, `column`, `spotType`) no ParkingSpot para suportar visualizacao em grid.
- Entregar endpoint de **mapa dinamico** do estacionamento.

Divisao em 7 checkpoints, cada um com commit manual entre eles.

---

## Decisoes arquiteturais

### Coexistencia HTTP CRUD ↔ Eventos

- **HTTP CRUD = admin/management.** Cadastrar lot, cadastrar spots, cadastrar driver/vehicle, listar, corrigir, desativar, ver mapa.
- **RabbitMQ events = operacional.** Camera detecta placa → emite evento → app-service cria/atualiza sessao automaticamente.
- Os dois caminhos sao independentes. Use cases vivem em [src/app/usecases/](../src/app/usecases/); app services de evento vivem em [src/app/services/parking/](../src/app/services/parking/).

### Sessions via HTTP

Sem `POST /parking-sessions` (start) e sem `POST /parking-sessions/:id/finish` operacional — o fluxo de evento lida com isso. HTTP expoe apenas:

- **READ:** `GET /parking-sessions/:id`, `GET /parking-lots/:lotId/active-sessions`, `GET /vehicles/:vehicleId/sessions`.
- **Admin override:** `POST /parking-sessions/:id/force-finish`, `POST /parking-sessions/:id/force-plate`.

### Soft delete

- Coluna `deactivated_at` nullable em `drivers`, `vehicles`, `parking_lots`, `parking_spots`.
- ParkingSession **NAO** tem soft delete (audit log — apenas `finish()`).
- Dominio: `deactivatedAt?: Date | null` nas Properties; metodos `deactivate(now)`, `isDeactivated()`, `isActive()`.
- Repositorios `findAll` filtram `deactivated_at IS NULL` por default. `findById` retorna mesmo desativado (UI admin pode querer ver).
- Use cases que abrem operacoes (ex: `Register*`) validam `isActive()` na entidade alvo.
- Tentar deactivate uma entidade ja desativada lanca `EntityAlreadyDeactivatedError` (domain) → 422.

### Convencoes de naming

Extraidas do codigo existente (vehicle-mapper, kysely-vehicle-repository, RegisterVehicleEntryAppService):

| Tipo | Arquivo | Classe |
|---|---|---|
| Mapper | `<entity>-mapper.ts` | `<Entity>Mapper` |
| Kysely repo | `kysely-<entity>-repository.ts` | `Kysely<Entity>Repository` |
| In-memory repo | `in-memory-<entity>-repository.ts` | `InMemory<Entity>Repository` |
| Use case | `<verb>-<noun>-usecase.ts` | `<Verb><Noun>UseCase` |
| Controller | `<resource>-controller.ts` | `<Resource>Controller` |
| Presenter | `<resource>-presenter.ts` | `<resource>Presenter` (objeto) |
| App exception | em `src/app/exceptions/<resource>/` | nome explicito, sem extends DomainError |

### Error handler

Reaproveita o existente em [src/infra/server/error-handler.ts](../src/infra/server/error-handler.ts). Mapeamento name-based:

| Padrao | Status |
|---|---|
| `error.name.startsWith('Invalid')` | 400 |
| `error.name.endsWith('NotFoundError')` | 404 |
| `error.name.startsWith('Duplicate')` | 409 |
| `error.name.includes('HasActive')` | 409 |
| `error instanceof DomainError` | 422 |
| outro | 500 (logado) |

Erros novos seguem a convencao: `*NotFoundError`, `Duplicate*Error`, `*HasActive*Error`.

### Use cases Mars-style

Um use case por arquivo, um por operacao. Sem orquestradores genericos. Cada use case implementa `UseCase<Input, Output>` ([src/app/shared/use-case.ts](../src/app/shared/use-case.ts)). Inputs e Outputs como tipos exportados.

---

## Checkpoint 1 — Foundation: Driver + ParkingLot + soft delete

**Objetivo:** preparar terreno antes de construir os endpoints. Adicionar `deactivated_at` em todas as entidades cadastrais; criar mappers + repositorios Kysely para Driver e ParkingLot (que ja tinham interfaces mas zero implementacao).

### Schema + migration

- [schema.prisma](../src/infra/database/prisma/schema.prisma) — `deactivatedAt DateTime? @db.Timestamptz(3) @map("deactivated_at")` em Driver, Vehicle, ParkingLot, ParkingSpot.
- Migration `20260511013614_add_soft_delete_columns`.

### Domain

- [driver.ts](../src/domain/parking/entities/driver.ts), [vehicle.ts](../src/domain/parking/entities/vehicle.ts), [parking-lot.ts](../src/domain/parking/entities/parking-lot.ts), [parking-spot.ts](../src/domain/parking/entities/parking-spot.ts) — adicionam `deactivatedAt`, `deactivate(now)`, `isDeactivated()`, `isActive()`. Driver e ParkingLot tambem ganham `updateInfo(...)`.
- [entity-already-deactivated.ts](../src/domain/parking/errors/entity-already-deactivated.ts) — erro de dominio.
- Interfaces de repositorio Driver e ParkingLot ganham `findAll()`.

### Infra

- 2 mappers novos: [driver-mapper.ts](../src/infra/database/kysely/mappers/driver-mapper.ts), [parking-lot-mapper.ts](../src/infra/database/kysely/mappers/parking-lot-mapper.ts).
- 2 mappers atualizados para ler `deactivated_at`: [vehicle-mapper.ts](../src/infra/database/kysely/mappers/vehicle-mapper.ts), [parking-spot-mapper.ts](../src/infra/database/kysely/mappers/parking-spot-mapper.ts).
- 2 repos Kysely novos: [kysely-driver-repository.ts](../src/infra/database/kysely/repositories/kysely-driver-repository.ts), [kysely-parking-lot-repository.ts](../src/infra/database/kysely/repositories/kysely-parking-lot-repository.ts).
- Hidratacao do `KyselyParkingSessionRepository` atualizada para incluir `deactivated_at` nos spot/vehicle embutidos.
- 2 in-memory repos novos para testes.
- TYPES expandido: `DriverMapper`, `ParkingLotMapper`.
- DI: [Mappers.ts](../src/infra/di/Mappers.ts) e [Repositories.ts](../src/infra/di/Repositories.ts) bind dos novos.

### Validacao

- `pnpm typecheck`, `pnpm lint`, `pnpm test` (59 testes), `pnpm test:di` — todos verdes.

---

## Checkpoint 2 — Driver HTTP CRUD

**Rotas:**
- `POST /drivers`
- `GET /drivers`
- `GET /drivers/:id`
- `PATCH /drivers/:id`
- `DELETE /drivers/:id`

### App layer

- [src/app/exceptions/driver/](../src/app/exceptions/driver/) — `DriverNotFoundError`, `DuplicateDriverCnhError`, `DuplicateDriverEmailError`.
- [src/app/usecases/driver/](../src/app/usecases/driver/) — `RegisterDriverUseCase`, `GetDriverByIdUseCase`, `ListDriversUseCase`, `UpdateDriverInfoUseCase`, `DeactivateDriverUseCase`. Cada um com `.spec.ts`.
- Error handler: adicionado `name.startsWith('Duplicate')` → 409.

### Infra HTTP

- [driver-presenter.ts](../src/infra/controllers/driver-presenter.ts) — DTO de resposta com `deactivatedAt: string | null` (ISO).
- [driver-controller.ts](../src/infra/controllers/driver-controller.ts) — validacao Zod manual no handler.
- DI: bind dos 5 use cases em [Usecases.ts](../src/infra/di/Usecases.ts), bind do controller em [Controllers.ts](../src/infra/di/Controllers.ts), registro no [server/index.ts](../src/infra/server/index.ts).

### Validacao

- 74 testes (+15).
- Smoke test: POST/GET/PATCH/DELETE; duplicate CNH → 409; email invalido → 400; not found → 404; re-DELETE → 422.

---

## Checkpoint 3 — ParkingLot HTTP CRUD

**Rotas:**
- `POST /parking-lots`
- `GET /parking-lots`
- `GET /parking-lots/:id`
- `PATCH /parking-lots/:id`
- `DELETE /parking-lots/:id`

### App layer

- [src/app/exceptions/parking-lot/](../src/app/exceptions/parking-lot/) — `ParkingLotNotFoundError`, `ParkingLotHasActiveSessionsError`.
- [src/app/usecases/parking-lot/](../src/app/usecases/parking-lot/) — `CreateParkingLotUseCase`, `GetParkingLotByIdUseCase`, `ListParkingLotsUseCase`, `UpdateParkingLotInfoUseCase`, `DeactivateParkingLotUseCase`. Cada um com `.spec.ts`.
- Error handler: adicionado `name.includes('HasActive')` → 409.

### Regra de negocio

`DeactivateParkingLotUseCase` bloqueia se houver qualquer sessao ativa no lote (via `ParkingSessionRepository.findMostRecentActive`).

### Validacao

- 85 testes (+11).
- Smoke test: POST/GET/PATCH/DELETE; capacity negativo → 400; not found → 404; re-DELETE → 422.

---

## Checkpoint 4 — Vehicle HTTP CRUD

**Rotas:**
- `POST /vehicles`
- `GET /vehicles/:id`
- `GET /drivers/:driverId/vehicles`
- `GET /parking-lots/:lotId/vehicles`
- `PATCH /vehicles/:id/appearance`
- `PATCH /vehicles/:id/owner`
- `DELETE /vehicles/:id`

### Domain extensions

- `VehicleRepository` ganha `findByParkingLotId(parkingLotId)` e `findAll()`.

### Infra

- [kysely-vehicle-repository.ts](../src/infra/database/kysely/repositories/kysely-vehicle-repository.ts) — implementacao + filtro `deactivated_at IS NULL`. `save` agora usa `mapper.toUpdate` (preserva `deactivated_at` no upsert).
- [in-memory-vehicle-repository.ts](../src/app/tests/in-memory-repositories/in-memory-vehicle-repository.ts) — 2 novos metodos.

### App layer

- [src/app/exceptions/vehicle/](../src/app/exceptions/vehicle/) — `VehicleNotFoundError`, `DuplicateVehicleLicensePlateError`, `VehicleHasActiveSessionError`.
- [src/app/usecases/vehicle/](../src/app/usecases/vehicle/) — 7 use cases:
  - `RegisterVehicleUseCase` (com ou sem driver, sempre dentro de um lot)
  - `GetVehicleByIdUseCase`
  - `ListVehiclesByDriverUseCase`
  - `ListVehiclesByLotUseCase`
  - `UpdateVehicleAppearanceUseCase`
  - `TransferVehicleOwnershipUseCase`
  - `DeactivateVehicleUseCase` (bloqueia se ha sessao ativa)

### Validacao

- 105 testes (+20).
- Smoke test: todos os 7 endpoints, duplicate plate → 409, placa invalida → 400, re-DELETE → 422.

---

## Checkpoint 5 — ParkingSpot HTTP CRUD + campos posicionais

**O mais pesado.** Adiciona os campos posicionais que destravam o mapa, atualizando codigo existente (factory, mapper, integration spec, hidratacao de session).

**Rotas:**
- `POST /parking-lots/:lotId/spots`
- `GET /parking-lots/:lotId/spots`
- `GET /parking-spots/:id`
- `PATCH /parking-spots/:id`
- `DELETE /parking-spots/:id`

### Schema + migration

- Enum `SpotType` (`REGULAR | COMPACT | LARGE | MOTORCYCLE | ACCESSIBLE | ELECTRIC`).
- `parking_spots` ganha `row Int @default(1)`, `column Int @default(1)`, `spotType SpotType @default(REGULAR)`.
- Migration `20260511021507_add_parking_spot_positional_fields`.
- **Follow-up:** apos garantir posicoes distintas na base existente (re-seed), migration manual `20260511022754_add_parking_spot_position_unique` aplica `@@unique([parkingLotId, floor, row, column])` ao DB. Defesa em duas camadas: app + DB.

### Domain

- Novo VO [spot-type-vo.ts](../src/domain/parking/value-objects/spot-type-vo.ts) — factories `regular()`, `compact()`, `large()`, `motorcycle()`, `accessible()`, `electric()`, `fromExisting(value)`, `serialize()`.
- [parking-spot.ts](../src/domain/parking/entities/parking-spot.ts) — `ParkingSpotProperties` ganha `row`, `column`, `spotType`. Novo metodo `updateMetadata({floor, row, column, isCovered, spotType})`. Getters correspondentes.
- [parking-spot.schema.ts](../src/domain/parking/schemas/parking-spot.schema.ts) (Zod) — adicionado enum `spotType` + campos.
- [parking-spot.factory.ts](../src/domain/parking/__tests__/factories/parking-spot.factory.ts) — defaults `row=1, column=1, spotType=REGULAR`.
- [parking-spot-repository.ts](../src/domain/parking/repositories/parking-spot-repository.ts) — adicionado `findByParkingLot`, `findByPosition` + tipo `ParkingSpotPosition`.

### Infra atualizada

- [parking-spot-mapper.ts](../src/infra/database/kysely/mappers/parking-spot-mapper.ts) — Selectable/Insertable/toDomain/toInsert/toUpdate com os 3 novos campos.
- [kysely-parking-spot-repository.ts](../src/infra/database/kysely/repositories/kysely-parking-spot-repository.ts) — `findByPosition`, `findByParkingLot`. `save` agora usa `toUpdate` completo.
- [kysely-parking-session-repository.ts](../src/infra/database/kysely/repositories/kysely-parking-session-repository.ts) — hidratacao do spot inclui `row`, `column`, `spot_type`.
- [in-memory-parking-spot-repository.ts](../src/app/tests/in-memory-repositories/in-memory-parking-spot-repository.ts) — 2 novos metodos + filtro `isActive()`.
- [seed.ts](../src/infra/database/seed.ts) — spots A=(1,1,1) e B=(1,1,2); `onConflict.doUpdateSet` para idempotencia.
- Integration specs atualizadas para passar `row`, `column`, `spotType`.

### App layer

- [src/app/exceptions/parking-spot/](../src/app/exceptions/parking-spot/) — `ParkingSpotNotFoundError`, `DuplicateSpotCodeError`, `DuplicateSpotPositionError`, `SpotHasActiveSessionError` (alinhado a convencao `HasActive` → 409).
- [src/app/usecases/parking-spot/](../src/app/usecases/parking-spot/) — 5 use cases:
  - `CreateParkingSpotUseCase` (valida lot ativo, codigo unico, posicao unica)
  - `GetParkingSpotByIdUseCase`
  - `ListParkingSpotsByLotUseCase`
  - `UpdateParkingSpotMetadataUseCase` (valida colisao de posicao quando muda)
  - `DeactivateParkingSpotUseCase` (bloqueia se ha sessao ativa)

### Validacao

- 120 testes (+15).
- Smoke test: codigo duplicado → 409, posicao duplicada → 409, todas as rotas OK.

---

## Checkpoint 6 — ParkingSession HTTP queries + admin overrides

**Rotas:**
- `GET /parking-sessions/:id`
- `GET /parking-lots/:lotId/active-sessions`
- `GET /vehicles/:vehicleId/sessions`
- `POST /parking-sessions/:id/force-finish` (body opcional `{exitAt?: ISO}`)
- `POST /parking-sessions/:id/force-plate` (body `{plate: string}`)

### Domain extensions

- [parking-session-repository.ts](../src/domain/parking/repositories/parking-session-repository.ts) — `findActiveByLot(parkingLotId)` (lista, ordenada por `entryAt asc`) e `findByVehicleId(vehicleId)` (ativas + finalizadas, ordenada por `entryAt desc`).

### Infra

- [kysely-parking-session-repository.ts](../src/infra/database/kysely/repositories/kysely-parking-session-repository.ts) — novo helper privado `queryHydratedSessions` para listas + 2 novos metodos.
- [in-memory-parking-session-repository.ts](../src/app/tests/in-memory-repositories/in-memory-parking-session-repository.ts) — 2 metodos com sort correto.

### App layer

- [parking-session-not-found-error.ts](../src/app/exceptions/parking-session/parking-session-not-found-error.ts).
- [src/app/usecases/parking-session/](../src/app/usecases/parking-session/) — 5 use cases:
  - `GetParkingSessionByIdUseCase`
  - `ListActiveSessionsByLotUseCase` (valida lot existe)
  - `ListSessionsByVehicleUseCase` (valida vehicle existe)
  - `ForceFinishSessionUseCase` — chama `session.finish({exitAt})` + publica eventos via `DomainEventPublisher`.
  - `ForcePlateSessionUseCase` — para sessao pendente sem placa: resolve/cria veiculo anonimo, chama `session.assignVehicle({vehicle})`.

### Notas

- `force-finish` usa `new Date()` como default; pode ser sobrescrito. Lanca `InvalidParkingPeriodError` (400) se `exitAt < entryAt`.
- `force-plate` lanca `SessionAlreadyHasVehicleError` (422 via DomainError) se a sessao ja tem veiculo. `assignVehicle` no agregado nao emite eventos no modelo atual.

### Validacao

- 134 testes (+14).
- Smoke test ponta-a-ponta: evento via `/events` → sessao criada → `GET .../active-sessions` lista → `GET /parking-sessions/:id` → `POST /:id/force-finish` finaliza → re-finish → 422 `SessionAlreadyFinishedError` → `POST /:id/force-plate` em sessao pendente cria veiculo anonimo e associa.

---

## Checkpoint 7 — Mapa dinamico

**Rota:** `GET /parking-lots/:id/map`

### Use case + presenter

- [get-parking-lot-map-usecase.ts](../src/app/usecases/parking-lot/get-parking-lot-map-usecase.ts) — agrega `ParkingLot` + `ParkingSpot[]` + `ParkingSession[]` em uma view.
- [parking-lot-map-presenter.ts](../src/infra/controllers/parking-lot-map-presenter.ts) — converte `Date → ISO string` na borda HTTP.

### Algoritmo

1. `parkingLot = lotRepo.findById(id)` — 404 se nao existe.
2. `spots = spotRepo.findByParkingLot(id)` (paralelo).
3. `sessions = sessionRepo.findActiveByLot(id)` (paralelo).
4. Mapeia `spotId → session` (1 sessao ativa por spot).
5. Agrupa spots por `floor`; calcula `grid.rows = max(row)`, `grid.columns = max(column)` por andar.
6. Calcula `durationMinutes` para cada sessao ativa a partir de `now` (`new Date()` default; injetavel via input para testes).
7. Calcula `occupancy = {free, occupied, reserved, total}`.

### DTO de resposta

```ts
{
  parkingLot: { id, name, address, totalCapacity },
  occupancy: { free, occupied, reserved, total },
  floors: [{
    floor: number,
    grid: { rows: number, columns: number },
    spots: [{
      id, code, row, column, isCovered, spotType, status,
      activeSession: status === 'OCCUPIED' ? {
        sessionId, vehicleId, vehicleLicensePlate,
        vehicleModel, vehicleColor,
        entryAt: ISO, durationMinutes
      } : null
    }]
  }]
}
```

O frontend renderiza um CSS Grid por andar com `grid.rows × grid.columns`, mapeia cada spot pela posicao `(row, column)`, colore por `status`, e mostra detalhes da `activeSession` ao clicar/hover.

### Validacao

- 137 testes (+3): golden path 2 andares, lot inexistente, lot sem spots.
- Smoke test ponta-a-ponta: lot com 6 spots em 2 andares (floor 1 = 2×3 com REGULAR/ELECTRIC/ACCESSIBLE/MOTORCYCLE/COMPACT; floor 2 = 1×1 LARGE). Estado inicial todos FREE. Apos inserir sessao ativa no spot A1, mapa retorna `occupancy={free:5,occupied:1,total:6}` e `activeSession` com placa, modelo, cor, entryAt e `durationMinutes`.

---

## Resumo final

| # | Checkpoint | Rotas | Use cases | Testes acumulados |
|---|---|---|---|---|
| 1 | Foundation | 0 | 0 | 59 |
| 2 | Driver | 5 | 5 | 74 |
| 3 | ParkingLot | 5 | 5 | 85 |
| 4 | Vehicle | 7 | 7 | 105 |
| 5 | ParkingSpot + posicional | 5 | 5 + 1 VO | 120 |
| 6 | ParkingSession queries + overrides | 5 | 5 | 134 |
| 7 | Mapa | 1 | 1 | 137 |
| **Total** | | **28 rotas** | **28 use cases** | **137 testes** |

### Tabela completa de rotas HTTP

| Metodo | Rota | Use case |
|---|---|---|
| POST | `/drivers` | `RegisterDriverUseCase` |
| GET | `/drivers` | `ListDriversUseCase` |
| GET | `/drivers/:id` | `GetDriverByIdUseCase` |
| PATCH | `/drivers/:id` | `UpdateDriverInfoUseCase` |
| DELETE | `/drivers/:id` | `DeactivateDriverUseCase` |
| POST | `/parking-lots` | `CreateParkingLotUseCase` |
| GET | `/parking-lots` | `ListParkingLotsUseCase` |
| GET | `/parking-lots/:id` | `GetParkingLotByIdUseCase` |
| PATCH | `/parking-lots/:id` | `UpdateParkingLotInfoUseCase` |
| DELETE | `/parking-lots/:id` | `DeactivateParkingLotUseCase` |
| GET | `/parking-lots/:id/map` | `GetParkingLotMapUseCase` |
| POST | `/vehicles` | `RegisterVehicleUseCase` |
| GET | `/vehicles/:id` | `GetVehicleByIdUseCase` |
| GET | `/drivers/:driverId/vehicles` | `ListVehiclesByDriverUseCase` |
| GET | `/parking-lots/:lotId/vehicles` | `ListVehiclesByLotUseCase` |
| PATCH | `/vehicles/:id/appearance` | `UpdateVehicleAppearanceUseCase` |
| PATCH | `/vehicles/:id/owner` | `TransferVehicleOwnershipUseCase` |
| DELETE | `/vehicles/:id` | `DeactivateVehicleUseCase` |
| POST | `/parking-lots/:lotId/spots` | `CreateParkingSpotUseCase` |
| GET | `/parking-lots/:lotId/spots` | `ListParkingSpotsByLotUseCase` |
| GET | `/parking-spots/:id` | `GetParkingSpotByIdUseCase` |
| PATCH | `/parking-spots/:id` | `UpdateParkingSpotMetadataUseCase` |
| DELETE | `/parking-spots/:id` | `DeactivateParkingSpotUseCase` |
| GET | `/parking-sessions/:id` | `GetParkingSessionByIdUseCase` |
| GET | `/parking-lots/:lotId/active-sessions` | `ListActiveSessionsByLotUseCase` |
| GET | `/vehicles/:vehicleId/sessions` | `ListSessionsByVehicleUseCase` |
| POST | `/parking-sessions/:id/force-finish` | `ForceFinishSessionUseCase` |
| POST | `/parking-sessions/:id/force-plate` | `ForcePlateSessionUseCase` |

### Migrations geradas

1. `20260511013614_add_soft_delete_columns` — colunas `deactivated_at` em 4 tabelas.
2. `20260511021507_add_parking_spot_positional_fields` — `row`, `column`, `spot_type` + enum `SpotType`.
3. `20260511022754_add_parking_spot_position_unique` — `@@unique([parkingLotId, floor, row, column])` (manual, via `prisma migrate deploy`).

---

## Fora de escopo

- Reservar vaga (`SpotStatusVO.RESERVED` existe mas nenhum use case usa).
- WebSocket / SSE do mapa — polling-friendly REST por enquanto.
- Frontend do mapa (projeto separado).
- Autenticacao / autorizacao.
- Paginacao em endpoints list — sem necessidade nesta escala.
- Endpoint admin para ver entidades desativadas (`findById` retorna mesmo desativadas; bastaria expor a flag para o UI tratar).
- Event bus real — eventos sao puxados via `pullDomainEvents` mas so logados pelo `LoggerDomainEventPublisher` em alguns fluxos.

## Notas tecnicas

- **Prisma 7 + Kysely:** o gerador `prisma-kysely` 3.1.0 emite `import "./Enums"` sem extensao `.ts`, incompativel com `moduleResolution: "nodenext"`. Fix manual no `Types.ts` apos cada `pnpm generate` ate uma configuracao adequada (post-process script ou downgrade de moduleResolution).
- **Prisma migrate dev nao-interativo:** quando o schema gera warning (unique constraint sobre dados existentes), `prisma migrate dev` falha em ambiente nao-interativo. Workaround: criar a migration SQL manualmente em `src/infra/database/prisma/migrations/<timestamp>_<name>/migration.sql` e aplicar via `npx prisma migrate deploy` — foi o caso da migration 3.
