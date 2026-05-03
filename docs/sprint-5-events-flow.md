# Sprint 5 — Fluxo de Eventos (`/events` → RabbitMQ → Handlers)

> **Status:** entregue 2026-05-03
> **Periodo:** Sprint 5 (12/05 – 25/05/2026), antecipada
> **Escopo:** exclusivamente o fluxo `/events` (sem CRUD de entidades)

---

## 1. Contexto

O servico `parking` recebe eventos do `vehicle-service` (rodando no Raspberry Pi do
TCC), traduz cada evento em uma transicao do agregado `ParkingSession` e persiste
o estado em Postgres. Esta sprint entrega:

1. **Refatoracao do dominio** para suportar transicoes incrementais
   (`enter` → `assignSpot` → `releaseSpot` → `finish`).
2. **Persistencia** completa via Prisma (schema/migrations) + Kysely (query builder).
3. **Mensageria interna** via RabbitMQ (topic exchange + DLQ por evento).
4. **Endpoint `POST /events`** que valida e republica em RabbitMQ.
5. **Handlers dedicados** por tipo de evento, cada um chamando um App Service.
6. **Auto-criacao de `Vehicle` anonimo** quando uma placa nova aparece — o
   vinculo com `Driver` fica para o CRUD futuro.

---

## 2. Visao Geral da Arquitetura

```mermaid
flowchart LR
    subgraph External["External (Raspberry Pi + WSL)"]
        camera[Camera RTSP]
        vs[vehicle-service<br/>FastAPI Python]
        rs[recognition-service<br/>YOLO + PaddleOCR]
        camera -->|frames| vs
        vs -->|HTTP /recognition/*| rs
    end

    subgraph Parking["parking API (Node 20 + Fastify)"]
        ctrl[RecognitionEventsController<br/>POST /events]
        pub[RabbitMQRecognitionEventPublisher]
        rmq{{RabbitMQ topic exchange<br/>recognition.events}}
        cv[Consumer<br/>vehicle.entered]
        co[Consumer<br/>spot.occupied]
        cr[Consumer<br/>spot.released]
        cx[Consumer<br/>vehicle.exited]
        h1[VehicleEnteredHandler]
        h2[SpotOccupiedHandler]
        h3[SpotReleasedHandler]
        h4[VehicleExitedHandler]
        s1[RegisterVehicleEntryAppService]
        s2[RegisterSpotOccupationAppService]
        s3[RegisterSpotReleaseAppService]
        s4[FinishParkingSessionAppService]
        agg[ParkingSession<br/>aggregate root]
        repos[(Postgres<br/>via Kysely)]
        log[LoggerDomainEventPublisher<br/>structured logs]

        ctrl --> pub --> rmq
        rmq --> cv --> h1 --> s1 --> agg
        rmq --> co --> h2 --> s2 --> agg
        rmq --> cr --> h3 --> s3 --> agg
        rmq --> cx --> h4 --> s4 --> agg
        s1 --> repos
        s2 --> repos
        s3 --> repos
        s4 --> repos
        agg --> log
    end

    vs -->|POST events| ctrl
```

### Camadas (Clean Architecture)

```mermaid
flowchart TD
    subgraph infra["src/infra/"]
        controllers[controllers/]
        di[di/]
        kysely[database/kysely/]
        msg[messaging/rabbitmq/]
        events[events/<br/>LoggerDomainEventPublisher]
        envsvc[services/<br/>EnvParkingLotResolver]
    end

    subgraph app["src/app/"]
        appsvc[services/parking/<br/>4 App Services]
        handlers[handlers/recognition/<br/>4 Handlers]
        appmsg[messaging/<br/>contracts]
        excs[exceptions/]
        tests[tests/<br/>in-memory repos + fakes]
    end

    subgraph domain["src/domain/"]
        agg[aggregates/parking-session/]
        ent[entities/]
        vo[value-objects/]
        err[errors/]
        repos[repositories/<br/>interfaces]
        shared[shared/<br/>Entity, AggregateRoot, ValueObject]
    end

    infra --> app
    infra --> domain
    app --> domain
```

Regras enforce-adas pelo `eslint-ddd-plugin.mjs`:
- `domain/` nao importa de `app/` ou `infra/`.
- `app/` nao importa de `infra/`.

---

## 3. Modelo de Dominio

### 3.1 Aggregate `ParkingSession`

```mermaid
classDiagram
    class ParkingSession {
        -vehicle: Vehicle
        -spot: ParkingSpot | null
        -status: SessionStatusVO
        -period: ParkingPeriodVO
        -spotReleasedAt: Date | null
        +enter(vehicle, entryAt)$
        +assignSpot(spot, occupiedAt)
        +releaseSpot(releasedAt)
        +finish(exitAt)
        +licensePlate() LicensePlateVO
        +isPendingSpot() boolean
        +hasSpotAssigned() boolean
    }
    class Vehicle {
        -driverId: UniqueIdentifier | null
        -parkingLotId: UniqueIdentifier
        -licensePlate: LicensePlateVO
        -brand, model, color
        +registerAnonymous()$
        +transferOwnershipTo(driverId)
    }
    class ParkingSpot {
        -parkingLotId: UniqueIdentifier
        -code: SpotCodeVO
        -status: SpotStatusVO
        +occupyBySession()
        +releaseBySession()
    }
    class SessionStatusVO {
        ACTIVE | FINISHED
        +finish() SessionStatusVO
    }
    class SpotStatusVO {
        FREE | OCCUPIED | RESERVED
        +occupy()
        +release()
    }
    class LicensePlateVO {
        AAA0A00 (Mercosul) | AAA0000 (legado)
        +from(rawValue)$
    }
    ParkingSession "1" --> "1" Vehicle
    ParkingSession "1" --> "0..1" ParkingSpot
    ParkingSession --> SessionStatusVO
    ParkingSpot --> SpotStatusVO
    Vehicle --> LicensePlateVO
```

### 3.2 Eventos do dominio (emitidos pelo aggregate)

| Evento | Quando | Payload |
|---|---|---|
| `parking.session.vehicle-entered` | `enter()` | `{sessionId, vehicleId, licensePlate, entryAt}` |
| `parking.session.started` | `enter()` | `{sessionId, vehicleId, licensePlate, entryAt}` |
| `parking.session.spot-occupied` | `assignSpot()` | `{sessionId, vehicleId, licensePlate, spotId, spotCode, occupiedAt}` |
| `parking.session.spot-released` | `releaseSpot()` | `{sessionId, spotId, spotCode, releasedAt}` |
| `parking.session.vehicle-exited` | `finish()` | `{sessionId, vehicleId, licensePlate, exitAt}` |
| `parking.session.finished` | `finish()` | `{sessionId, vehicleId, licensePlate, entryAt, exitAt}` |

### 3.3 Estado da sessao

```mermaid
stateDiagram-v2
    [*] --> ACTIVE_pending: enter()
    ACTIVE_pending --> ACTIVE_with_spot: assignSpot()
    ACTIVE_with_spot --> ACTIVE_spot_released: releaseSpot()
    ACTIVE_pending --> FINISHED: finish() [patologico]
    ACTIVE_with_spot --> FINISHED: finish() [defensivo: libera spot]
    ACTIVE_spot_released --> FINISHED: finish()
    FINISHED --> [*]

    note right of ACTIVE_pending
        spot=null, vehicle=set
        emite VehicleEntered + SessionStarted
    end note
    note right of ACTIVE_with_spot
        spot.status=OCCUPIED
        emite SpotOccupied
    end note
    note right of ACTIVE_spot_released
        spot.status=FREE
        spotReleasedAt preenchido
        emite SpotReleased
    end note
    note right of FINISHED
        period fechado, exitAt preenchido
        emite VehicleExited + SessionFinished
    end note
```

---

## 4. Fluxo Ponta-a-Ponta dos 4 Eventos

### 4.1 Sequence diagram

```mermaid
sequenceDiagram
    autonumber
    participant V as vehicle-service<br/>(Raspberry)
    participant C as RecognitionEventsController
    participant Z as Zod validator
    participant P as RabbitMQRecognitionEventPublisher
    participant R as RabbitMQ<br/>recognition.events
    participant H as Handler dedicado
    participant S as App Service
    participant D as Domain (ParkingSession)
    participant DB as Postgres
    participant L as LoggerDomainEventPublisher

    V->>C: POST /events {event, plate, ...}
    C->>Z: parse(payload)
    Z-->>C: ok
    C->>P: publish(payload)
    P->>R: publish(routingKey=event.type)
    R-->>C: ack
    C-->>V: 202 {accepted: true}

    R->>H: deliver(payload)
    H->>S: execute(input)
    S->>DB: findByLicensePlate / findActiveByPlate
    S->>D: enter / assignSpot / releaseSpot / finish
    D-->>S: domain events (pull)
    S->>DB: save (transaction)
    S->>L: publish(events)
    L-->>L: log estruturado
    H-->>R: ack
```

### 4.2 Mapeamento evento HTTP → App Service

| Evento HTTP | Routing key | Fila | Handler | App Service |
|---|---|---|---|---|
| `vehicle.entered` | `vehicle.entered` | `recognition.events.q.vehicle.entered` | `VehicleEnteredHandler` | `RegisterVehicleEntryAppService` |
| `spot.occupied` | `spot.occupied` | `recognition.events.q.spot.occupied` | `SpotOccupiedHandler` | `RegisterSpotOccupationAppService` |
| `spot.released` | `spot.released` | `recognition.events.q.spot.released` | `SpotReleasedHandler` | `RegisterSpotReleaseAppService` |
| `vehicle.exited` | `vehicle.exited` | `recognition.events.q.vehicle.exited` | `VehicleExitedHandler` | `FinishParkingSessionAppService` |

### 4.3 Topologia RabbitMQ

```mermaid
flowchart LR
    EX{{recognition.events<br/>topic exchange}}
    DLX{{recognition.events.dlx<br/>topic exchange}}
    Q1[q.vehicle.entered]
    Q2[q.spot.occupied]
    Q3[q.spot.released]
    Q4[q.vehicle.exited]
    DLQ1[q.vehicle.entered.dlq]
    DLQ2[q.spot.occupied.dlq]
    DLQ3[q.spot.released.dlq]
    DLQ4[q.vehicle.exited.dlq]

    EX -->|vehicle.entered| Q1
    EX -->|spot.occupied| Q2
    EX -->|spot.released| Q3
    EX -->|vehicle.exited| Q4

    Q1 -.x-dead-letter-exchange.-> DLX
    Q2 -.x-dead-letter-exchange.-> DLX
    Q3 -.x-dead-letter-exchange.-> DLX
    Q4 -.x-dead-letter-exchange.-> DLX

    DLX -->|vehicle.entered| DLQ1
    DLX -->|spot.occupied| DLQ2
    DLX -->|spot.released| DLQ3
    DLX -->|vehicle.exited| DLQ4
```

Cada fila e durable. Mensagens com erro de processamento sao `nack`-eadas (sem
re-enfileirar) e roteadas para a DLQ via `x-dead-letter-exchange`.

---

## 5. Modelo de Dados (Postgres)

```mermaid
erDiagram
    drivers ||--o{ vehicles : "owns (nullable)"
    parking_lots ||--o{ parking_spots : "contains"
    parking_lots ||--o{ vehicles : "registered_in"
    vehicles ||--o{ parking_sessions : "uses"
    parking_spots ||--o{ parking_sessions : "occupied_by"

    drivers {
        uuid id PK
        text cnh UK
        text email UK
        text name
        text phone
    }
    parking_lots {
        uuid id PK
        text name
        text address
        int total_capacity
    }
    parking_spots {
        uuid id PK
        uuid parking_lot_id FK
        text code
        int floor
        bool is_covered
        spot_status status
    }
    vehicles {
        uuid id PK
        uuid driver_id FK "nullable"
        uuid parking_lot_id FK
        text license_plate UK
        text brand "nullable"
        text model "nullable"
        text color "nullable"
    }
    parking_sessions {
        uuid id PK
        uuid vehicle_id FK
        uuid spot_id FK "nullable"
        session_status status
        timestamptz entry_at
        timestamptz spot_released_at "nullable"
        timestamptz exit_at "nullable"
    }
```

Enums: `SpotStatus { FREE OCCUPIED RESERVED }`, `SessionStatus { ACTIVE FINISHED }`.

Indices: `parking_sessions(vehicle_id, status)` e `parking_sessions(spot_id, status)`
suportam as queries `findActiveByPlate` (via JOIN com `vehicles`) e `findActiveBySpot`.

---

## 6. Estrutura de Codigo

```
src/
├── domain/
│   ├── parking/
│   │   ├── aggregates/parking-session/
│   │   │   ├── parking-session.ts                # aggregate root
│   │   │   ├── events/                           # 6 eventos + 6 mappers
│   │   │   └── parking-session.spec.ts           # 21 unit tests
│   │   ├── entities/
│   │   │   ├── driver.ts
│   │   │   ├── parking-lot.ts
│   │   │   ├── parking-spot.ts
│   │   │   └── vehicle.ts                        # registerAnonymous adicionado
│   │   ├── value-objects/                        # 5 VOs
│   │   ├── errors/                               # 7 domain errors
│   │   ├── repositories/                         # 5 interfaces
│   │   ├── schemas/                              # zod schemas
│   │   └── __tests__/factories/                  # makeVehicle, makeParkingSpot, ...
│   └── shared/                                   # Entity, AggregateRoot, ValueObject
│
├── app/
│   ├── shared/app-service.ts                     # AppService<I,O>
│   ├── dto/types.ts                              # symbols DI
│   ├── services/
│   │   ├── parking-lot-resolver.ts               # interface
│   │   └── parking/
│   │       ├── register-vehicle-entry.app-service.ts
│   │       ├── register-spot-occupation.app-service.ts
│   │       ├── register-spot-release.app-service.ts
│   │       └── finish-parking-session.app-service.ts
│   ├── handlers/recognition/                     # 4 handlers
│   ├── messaging/
│   │   ├── recognition-event-payload.ts          # contratos
│   │   └── recognition-event-publisher.ts        # interface
│   ├── exceptions/recognition/                   # InvalidRecognitionPlate, ...
│   └── tests/
│       ├── in-memory-repositories/               # 3 fakes
│       └── factories/                            # publisher fake, lot resolver
│
└── infra/
    ├── controllers/
    │   ├── HealthController.ts
    │   ├── RecognitionEventsController.ts
    │   └── recognition/event-payload.schema.ts   # zod discriminated union
    ├── database/
    │   ├── Connection.ts                         # Kysely<DB> tipado
    │   ├── seed.ts                               # popula 1 lot + 2 spots
    │   ├── prisma/schema.prisma
    │   └── kysely/
    │       ├── mappers/                          # 3 mappers
    │       └── repositories/                     # 3 repos + .integration.spec.ts
    ├── messaging/rabbitmq/
    │   ├── connection.ts                         # singleton + reconnect
    │   ├── topology.ts                           # exchange/queue/DLX
    │   ├── rabbitmq-recognition-event-publisher.ts
    │   ├── recognition-event-consumer.ts         # generico com retry
    │   └── recognition-flow.integration.spec.ts
    ├── events/logger-domain-event-publisher.ts
    ├── services/env-parking-lot-resolver.ts
    ├── server/
    │   ├── index.ts                              # bootstrap completo
    │   └── error-handler.ts
    ├── env/environment.ts                        # zod env schema
    └── di/
        ├── Container.ts
        ├── Mappers.ts
        ├── Repositories.ts
        ├── Services.ts
        ├── AppServices.ts                        # binds dos 4 services + 4 handlers
        ├── Usecases.ts                           # vazio (reservado para futuro)
        └── Controllers.ts
```

---

## 7. App Services — Resumo das Regras

### 7.1 `RegisterVehicleEntryAppService` (vehicle.entered)

```mermaid
flowchart TD
    A[plate: string-null, entryAt] --> B{plate == null?}
    B -->|sim| Z1[throw InvalidRecognitionPlateError]
    B -->|nao| C[LicensePlateVO.from plate]
    C --> D[findActiveByPlate]
    D --> E{ja existe?}
    E -->|sim| F[return duplicate-discarded]
    E -->|nao| G[findOrCreate Vehicle anonimo]
    G --> H[ParkingSession.enter]
    H --> I[save session]
    I --> J[publish domain events]
    J --> K[return created]
```

### 7.2 `RegisterSpotOccupationAppService` (spot.occupied)

- Valida plate; resolve `ParkingSpot` por `(parkingLotId, code)`.
- Auto-cria `Vehicle` se a placa nao existe.
- Resolve sessao ativa por placa; se nao existe (caso patologico), chama `enter`.
- `session.assignSpot({spot, occupiedAt})`.
- Persiste em transacao (vehicle + session + spot status).

### 7.3 `RegisterSpotReleaseAppService` (spot.released)

- Resolve `ParkingSpot`; lookup da sessao por placa, fallback para `findActiveBySpot`.
- `session.releaseSpot({releasedAt})`.

### 7.4 `FinishParkingSessionAppService` (vehicle.exited)

- Valida plate; `findActiveByPlate`; throw se nao encontrar.
- `session.finish({exitAt})` — defensivamente libera spot se ainda estiver ocupado.

---

## 8. Cobertura de Testes

| Tipo | Quantidade | Arquivos |
|---|---:|---|
| **Unit (dominio)** | 31 | `parking-session.spec.ts` (21), `license-plate-vo.spec.ts` (10) |
| **Unit (app services)** | 20 | 4 specs em `app/services/parking/` |
| **Integration (Postgres)** | 16 | 3 specs em `infra/database/kysely/repositories/` |
| **Integration (RabbitMQ)** | 2 | `recognition-flow.integration.spec.ts` |
| **Total** | **69** | — |

Convencoes:
- Sufixo `.spec.ts` (unit) ou `.integration.spec.ts` (com infra real).
- Factories em `__tests__/factories/` (dominio) e `tests/factories/` (app).
- Nomes `it('should ...')` descrevendo o comportamento assertado.

Comandos:
```bash
pnpm test              # unit (rapido, sem dependencia externa)
pnpm test:integration  # integration (precisa de Postgres + RabbitMQ rodando)
pnpm test:all          # ambos
pnpm pr                # pipeline completa: test + lint + typecheck + build
```

---

## 9. Smoke E2E Validado

Com `docker compose up -d` (Postgres + RabbitMQ), `pnpm migrate`, `pnpm seed`, `pnpm dev`:

```bash
curl -X POST localhost:3000/events -H 'Content-Type: application/json' \
  -d '{"event":"vehicle.entered","plate":"ABC1D23","timestamp":"2026-05-03T10:00:00Z"}'

curl -X POST localhost:3000/events -H 'Content-Type: application/json' \
  -d '{"event":"spot.occupied","spot_id":"A","plate":"ABC1D23","confidence":0.95,"timestamp":"2026-05-03T10:00:30Z"}'

curl -X POST localhost:3000/events -H 'Content-Type: application/json' \
  -d '{"event":"spot.released","spot_id":"A","plate":"ABC1D23","timestamp":"2026-05-03T11:00:00Z"}'

curl -X POST localhost:3000/events -H 'Content-Type: application/json' \
  -d '{"event":"vehicle.exited","plate":"ABC1D23","timestamp":"2026-05-03T11:00:30Z"}'
```

Resultado validado em 2026-05-03:

| | Esperado | Observado |
|---|---|---|
| HTTP responses | 4× `202 {accepted:true}` | OK |
| Filas RabbitMQ | todas zeradas | OK |
| DLQs | todas vazias | OK |
| `parking_sessions` | 1 linha `FINISHED`, todos timestamps preenchidos | OK |
| `vehicles` | `ABC1D23` criado, `driver_id NULL` | OK |
| `parking_spots` `A` | `status=FREE` | OK |
| Domain events nos logs | 6 em ordem | OK |

---

## 10. Configuracao

### Variaveis de ambiente
```
NODE_ENV=development
PORT=3000

DATABASE_URL=postgresql://parking:parking@localhost:5432/parking
DB_HOST=localhost
DB_PORT=5432
DB_NAME=parking
DB_USER=parking
DB_PASSWORD=parking
DB_MAX_POOL_SIZE=10

RABBITMQ_URL=amqp://guest:guest@localhost:5672
RABBITMQ_RECOGNITION_EXCHANGE=recognition.events
RABBITMQ_PREFETCH=10

DEFAULT_PARKING_LOT_ID=11111111-1111-4111-8111-111111111111
```

### Servicos do `docker-compose.yml`
- `parking-postgres` (postgres:16-alpine) na 5432.
- `parking-rabbitmq` (rabbitmq:3-management-alpine) na 5672 + UI 15672.

### Scripts do `package.json`
- `pnpm dev` — nodemon + tsx, hot reload de TS.
- `pnpm migrate` — `prisma migrate dev`.
- `pnpm generate` — gera tipos Kysely a partir do schema.
- `pnpm seed` — popula ParkingLot demo + spots A/B.
- `pnpm test`, `pnpm test:integration`, `pnpm test:all`.
- `pnpm pr` — pipeline completa.

---

## 11. Decisoes de Design

### 11.1 `Vehicle` sempre presente em `ParkingSession`
Modelo inicial tinha `licensePlate` no proprio agregado. Refatorado para que a placa
venha de `vehicle.licensePlate()` — evita duplicacao. `Vehicle` e criado on-the-fly
no `vehicle.entered` (anonimo, sem `Driver`). O CRUD futuro vincula `Driver` depois.

### 11.2 4 eventos NAO sao redundantes
Cada um carrega informacao distinta:
- `vehicle.entered`: chegada ao perimetro (sem spot ainda).
- `spot.occupied`: traz `spot_id` + `confidence`.
- `spot.released`: vaga livre, veiculo ainda no perimetro.
- `vehicle.exited`: saida final do perimetro.

### 11.3 `/events` e dumb
O controller so valida com Zod e republica em RabbitMQ. NAO chama App Service direto.
Beneficios: decoupling, retry/DLQ, ordering por routing key, throughput controlado
por `prefetch`.

### 11.4 Correlator = `plate`
Nao ha `trackingId` no `vehicle-service` hoje. Todos os 4 eventos carregam `plate`
(nullable). Quando `plate=null`, o handler descarta para DLQ (fail-fast).

### 11.5 `ActiveSessionPolicy` removido
A policy era redundante com a verificacao explicita nos App Services
(`findActiveByPlate` + descartar duplicata).

### 11.6 `App Services` x `Use Cases`
- `app/services/` (bind em `Services.ts`) — orquestradores chamados pelos handlers.
- `app/usecases/` (bind em `Usecases.ts`) — RESERVADO para fluxos administrativos
  manuais (correcao manual, consultas) que serao adicionados em sprint futura.

---

## 12. Limitacoes Conhecidas e Proximos Passos

### Fora do escopo desta sprint
- CRUD HTTP de Driver/Vehicle/ParkingLot/ParkingSpot (proximo plano).
- Auth.
- Frontend.
- Roteamento por `camera_id` quando o `vehicle-service` enviar.
- Substituicao do `LoggerDomainEventPublisher` por publisher RabbitMQ separado para
  domain events (Sprint 6).

### Cenarios degradados ja tratados
| Cenario | Comportamento |
|---|---|
| `plate=null` | DLQ (`InvalidRecognitionPlateError`) |
| `spot.occupied` sem `vehicle.entered` previo | App Service cria sessao via `enter()` no mesmo passo |
| `vehicle.exited` sem sessao ativa | DLQ (`ActiveSessionNotFoundError`) |
| `spot.released` sem sessao ativa | DLQ (`ActiveSessionNotFoundError`) |
| Duplicata `vehicle.entered` | descartada por idempotencia (`findActiveByPlate`) |
| `finish()` sem `releaseSpot` previo | aggregate libera spot defensivamente |
| Falha do handler | retry 3x via `x-death`; depois DLQ |

---

## 13. Cronologia da Sprint

```mermaid
gantt
    title Sprint 5 - Eventos
    dateFormat YYYY-MM-DD
    section Fase 1 — Persistencia
    Refatoracao do dominio          :done, d1, 2026-04-30, 1d
    Schema Prisma + migration       :done, d2, after d1, 1d
    Mappers + Repos Kysely          :done, d3, after d2, 1d
    Testes integracao Postgres      :done, d4, after d3, 1d
    section Fase 2 — App Services
    In-memory repos + factories     :done, d5, after d4, 1d
    4 App Services + testes unit    :done, d6, after d5, 1d
    section Fase 3 — Mensageria
    RabbitMQ infra                  :done, d7, after d6, 1d
    Smoke RabbitMQ                  :done, d8, after d7, 1d
    section Fase 4 — HTTP + Bootstrap
    Handlers + DI                   :done, d9, after d8, 1d
    Controller /events + error handler :done, d10, after d9, 1d
    Bootstrap + smoke E2E           :done, d11, after d10, 1d
```

---

## 14. Comandos Cheat-Sheet

```bash
# Subir infra
docker compose up -d

# Aplicar schema
pnpm migrate
pnpm generate

# Popular dados
pnpm seed

# Rodar servico
pnpm dev

# Testar
pnpm test                # unit
pnpm test:integration    # integration (precisa docker up)
pnpm pr                  # pipeline completa

# Inspecao
docker exec parking-postgres psql -U parking -d parking
# RabbitMQ UI: http://localhost:15672 (guest/guest)
```
