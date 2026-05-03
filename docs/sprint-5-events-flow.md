# Sprint 5 — Fluxo de Eventos (`/events` → RabbitMQ → Handlers)

> **Escopo:** exclusivamente o fluxo `/events` (sem CRUD de entidades)

---

## 1. Contexto

O servico `parking` recebe eventos do `vehicle-service` (rodando no Raspberry Pi),
traduz cada evento em uma transicao do agregado `ParkingSession` e persiste o
estado em Postgres.

### Realidade do `vehicle-service` (Sprint 1)

O loop do `parking_monitor.py` faz **duas chamadas de reconhecimento por ciclo**:

1. **`POST /recognition/frame-presence`** (frame inteiro) — retorna apenas
   `{vehicle_detected, confidence}`, **NAO** retorna placa.
2. **`POST /recognition/spot`** (recorte da vaga) — retorna
   `{vehicle_detected, plate, confidence}`. So aqui a placa fica disponivel.

Sequencia exata por ciclo:

```
detect_frame_presence(frame_completo)        ← sem placa
  └── _handle_parking_presence(detected)
        └── notify_vehicle_entered(state.current_plate)  ← plate=None na primeira deteccao
for spot in self.spots:
    detect_spot(spot_id, recorte)            ← retorna placa
      └── _on_spot_occupied(spot, plate)
            └── state.current_plate = plate  ← plate populada AQUI
            └── notify_spot_occupied(spot_id, plate, conf)
```

**Consequencia:** o evento `vehicle.entered` chega no parking API com
`plate=null` (a placa ainda nao foi descoberta pelo OCR). So `spot.occupied`
traz a placa pela primeira vez. Em ciclos subsequentes, o `vehicle-service`
mantem `state.current_plate` no estado interno, entao `spot.released` e
`vehicle.exited` ja chegam com a placa.

| Evento | `plate` na pratica | Por que? |
|---|---|---|
| `vehicle.entered` | **`null`** | Frame-level fired antes do spot-level no mesmo ciclo |
| `spot.occupied` | placa real | Spot-level retorna do OCR |
| `spot.released` | placa real | Mantida em `spot.current_plate` |
| `vehicle.exited` | placa real | Mantida em `state.current_plate` |

### Resposta do parking API: sessao pendente

Em vez de exigir placa para criar sessao, o parking trata `vehicle.entered`
como abertura de uma **sessao pendente** (`vehicle=null`, `spot=null`). Quando
`spot.occupied` chega com placa, o App Service:

1. Resolve ou cria `Vehicle` (auto-anonimo se placa desconhecida).
2. Localiza a sessao pendente mais antiga do `parking_lot` via
   `findOldestPendingVehicle`.
3. Chama `session.assignVehicle({vehicle})` + `session.assignSpot({spot, ...})`.

`spot.released` localiza a sessao por placa. `vehicle.exited` tambem usa placa,
com fallback para `findMostRecentActive(parkingLotId)` se a placa ja foi limpa.

---

## 2. Visao Geral da Arquitetura

```mermaid
flowchart LR
    subgraph External["External (Raspberry Pi + WSL)"]
        camera[Camera RTSP]
        vs[vehicle-service<br/>FastAPI Python]
        rs[recognition-service<br/>YOLO + PaddleOCR]
        camera -->|frames| vs
        vs -->|HTTP /recognition/frame-presence<br/>HTTP /recognition/spot| rs
    end

    subgraph Parking["parking API (Node 20 + Fastify)"]
        ctrl[RecognitionEventsController<br/>POST /events]
        pub[RabbitMQRecognitionEventPublisher]
        rmq{{RabbitMQ topic exchange<br/>recognition.events}}
        cv[Consumer<br/>vehicle.entered]
        co[Consumer<br/>spot.occupied]
        cr[Consumer<br/>spot.released]
        cx[Consumer<br/>vehicle.exited]
        h1[VehicleEnteredHandler] --> s1[RegisterVehicleEntryAppService]
        h2[SpotOccupiedHandler] --> s2[RegisterSpotOccupationAppService]
        h3[SpotReleasedHandler] --> s3[RegisterSpotReleaseAppService]
        h4[VehicleExitedHandler] --> s4[FinishParkingSessionAppService]
        agg[ParkingSession<br/>aggregate root]
        repos[(Postgres<br/>via Kysely)]
        log[LoggerDomainEventPublisher<br/>structured logs]

        ctrl --> pub --> rmq
        rmq --> cv --> h1
        rmq --> co --> h2
        rmq --> cr --> h3
        rmq --> cx --> h4
        s1 --> agg
        s2 --> agg
        s3 --> agg
        s4 --> agg
        s1 --> repos
        s2 --> repos
        s3 --> repos
        s4 --> repos
        agg --> log
    end

    vs -->|POST /events| ctrl
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

---

## 3. Modelo de Dominio

### 3.1 Aggregate `ParkingSession` (apos refator de sessao pendente)

```mermaid
classDiagram
    class ParkingSession {
        -parkingLotId: UniqueIdentifier
        -vehicle: Vehicle | null
        -spot: ParkingSpot | null
        -status: SessionStatusVO
        -period: ParkingPeriodVO
        -spotReleasedAt: Date | null
        +enter(parkingLotId, vehicle?, entryAt)$
        +assignVehicle(vehicle)
        +assignSpot(spot, occupiedAt)
        +releaseSpot(releasedAt)
        +finish(exitAt)
        +licensePlate() LicensePlateVO | null
        +isPendingVehicle() boolean
        +isPendingSpot() boolean
    }
    class Vehicle {
        -driverId: UniqueIdentifier | null
        -parkingLotId: UniqueIdentifier
        -licensePlate: LicensePlateVO
        +registerAnonymous()$
    }
    class ParkingSpot {
        -parkingLotId: UniqueIdentifier
        -code: SpotCodeVO
        -status: SpotStatusVO
        +occupyBySession()
        +releaseBySession()
    }
    ParkingSession "1" --> "0..1" Vehicle
    ParkingSession "1" --> "0..1" ParkingSpot
```

`vehicle` e `spot` sao opcionais. `parkingLotId` e obrigatorio (chave para
encontrar sessoes pendentes).

### 3.2 State machine

```mermaid
stateDiagram-v2
    [*] --> Pending_no_vehicle: enter parkingLotId, plate=null
    [*] --> Active_no_spot: enter parkingLotId, vehicle
    Pending_no_vehicle --> Active_no_spot: assignVehicle
    Active_no_spot --> Active_with_spot: assignSpot
    Active_with_spot --> Active_spot_released: releaseSpot
    Pending_no_vehicle --> FINISHED: finish [drive-through sem OCR]
    Active_no_spot --> FINISHED: finish
    Active_with_spot --> FINISHED: finish [defensivo: libera spot]
    Active_spot_released --> FINISHED: finish
    FINISHED --> [*]

    note right of Pending_no_vehicle
        vehicle=null, spot=null
        Esperando spot.occupied trazer placa
    end note
    note right of Active_no_spot
        vehicle setado, spot=null
    end note
    note right of Active_with_spot
        spot.status=OCCUPIED
    end note
    note right of Active_spot_released
        spot.status=FREE,
        spotReleasedAt preenchido
    end note
```

### 3.3 Eventos do dominio

| Evento | Quando | Payload |
|---|---|---|
| `parking.session.vehicle-entered` | `enter()` | `{sessionId, parkingLotId, vehicleId\|null, licensePlate\|null, entryAt}` |
| `parking.session.started` | `enter()` | `{sessionId, parkingLotId, vehicleId\|null, licensePlate\|null, entryAt}` |
| `parking.session.spot-occupied` | `assignSpot()` | `{sessionId, vehicleId\|null, licensePlate\|null, spotId, spotCode, occupiedAt}` |
| `parking.session.spot-released` | `releaseSpot()` | `{sessionId, spotId, spotCode, releasedAt}` |
| `parking.session.vehicle-exited` | `finish()` | `{sessionId, parkingLotId, vehicleId\|null, licensePlate\|null, exitAt}` |
| `parking.session.finished` | `finish()` | `{sessionId, parkingLotId, vehicleId\|null, licensePlate\|null, entryAt, exitAt}` |

`vehicleId` e `licensePlate` ficam null **so** quando a sessao termina sem ter
recebido `spot.occupied` (caso patologico — drive-through). Nos casos normais,
`spot.occupied` chega antes e popula esses campos para os eventos seguintes.

---

## 4. Fluxo Real Ponta-a-Ponta

```mermaid
sequenceDiagram
    autonumber
    participant V as vehicle-service
    participant C as Controller /events
    participant R as RabbitMQ
    participant H1 as VehicleEnteredHandler
    participant H2 as SpotOccupiedHandler
    participant H3 as SpotReleasedHandler
    participant H4 as VehicleExitedHandler
    participant DB as Postgres

    Note over V: Frame detecta veiculo (sem placa ainda)
    V->>C: POST /events {event:vehicle.entered, plate:null, ts}
    C->>R: publish routingKey=vehicle.entered
    C-->>V: 202
    R->>H1: payload
    H1->>DB: INSERT ParkingSession (vehicle_id=NULL, spot_id=NULL, status=ACTIVE)

    Note over V: Spot detecta placa via OCR
    V->>C: POST /events {event:spot.occupied, spot_id:A, plate:ABC, conf:0.95, ts}
    C->>R: publish routingKey=spot.occupied
    C-->>V: 202
    R->>H2: payload
    H2->>DB: SELECT ParkingSession pendente (vehicle_id IS NULL) ORDER BY entry_at ASC LIMIT 1
    H2->>DB: SELECT Vehicle by license_plate
    alt Vehicle existe
        H2->>DB: nada
    else Vehicle novo
        H2->>DB: INSERT Vehicle anonimo
    end
    H2->>DB: UPDATE ParkingSpot status=OCCUPIED
    H2->>DB: UPDATE ParkingSession SET vehicle_id=..., spot_id=...

    Note over V: Veiculo deixou a vaga
    V->>C: POST /events {event:spot.released, spot_id:A, plate:ABC, ts}
    H3->>DB: SELECT ParkingSession active by plate
    H3->>DB: UPDATE ParkingSpot status=FREE
    H3->>DB: UPDATE ParkingSession SET spot_released_at=...

    Note over V: Veiculo deixou o perimetro
    V->>C: POST /events {event:vehicle.exited, plate:ABC, ts}
    H4->>DB: SELECT ParkingSession active by plate
    H4->>DB: UPDATE ParkingSession SET status=FINISHED, exit_at=...
```

### Mapeamento evento HTTP → App Service

| Evento HTTP | Routing key | Fila | Handler | App Service |
|---|---|---|---|---|
| `vehicle.entered` | `vehicle.entered` | `recognition.events.q.vehicle.entered` | `VehicleEnteredHandler` | `RegisterVehicleEntryAppService` |
| `spot.occupied` | `spot.occupied` | `recognition.events.q.spot.occupied` | `SpotOccupiedHandler` | `RegisterSpotOccupationAppService` |
| `spot.released` | `spot.released` | `recognition.events.q.spot.released` | `SpotReleasedHandler` | `RegisterSpotReleaseAppService` |
| `vehicle.exited` | `vehicle.exited` | `recognition.events.q.vehicle.exited` | `VehicleExitedHandler` | `FinishParkingSessionAppService` |

### Topologia RabbitMQ

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

Filas durable. Mensagens com erro sao `nack`-eadas (sem requeue) e roteadas para
DLQ via `x-dead-letter-exchange`.

---

## 5. App Services — Regras Atualizadas

### 5.1 `RegisterVehicleEntryAppService` (vehicle.entered)

```mermaid
flowchart TD
    A[plate, entryAt] --> B{plate == null?}
    B -->|sim| P[ParkingSession.enter parkingLotId, entryAt SEM vehicle]
    P --> P2[save + publish events]
    P2 --> R1[return created-pending-vehicle]
    B -->|nao| C[LicensePlateVO.from]
    C --> D[findActiveByPlate]
    D --> E{ja existe?}
    E -->|sim| R2[return duplicate-discarded]
    E -->|nao| G[findOrCreate Vehicle anonimo]
    G --> H[ParkingSession.enter com vehicle]
    H --> H2[save + publish events]
    H2 --> R3[return created-with-vehicle]
```

Output: `'created-with-vehicle' | 'created-pending-vehicle' | 'duplicate-discarded'`.

### 5.2 `RegisterSpotOccupationAppService` (spot.occupied)

```mermaid
flowchart TD
    A[plate, spotCode, occupiedAt] --> B{plate null?}
    B -->|sim| Z[throw InvalidRecognitionPlateError]
    B -->|nao| C[Resolve ParkingSpot by code]
    C --> D[findOrCreate Vehicle by plate]
    D --> E[Resolver sessao]
    E --> F1[findActiveByPlate]
    F1 -->|encontra| OK1[usa essa sessao]
    F1 -->|nao| F2[findOldestPendingVehicle parkingLotId]
    F2 -->|encontra| AV[session.assignVehicle vehicle]
    AV --> OK2[usa essa sessao]
    F2 -->|nao| F3[ParkingSession.enter com vehicle]
    F3 --> OK3[usa nova sessao]
    OK1 --> S[session.assignSpot spot]
    OK2 --> S
    OK3 --> S
    S --> SAVE[save + publish events]
```

### 5.3 `RegisterSpotReleaseAppService` (spot.released)

- Resolve `ParkingSpot`.
- Sessao: tenta `findActiveByPlate` se plate existe, fallback `findActiveBySpot`.
- `session.releaseSpot({releasedAt})`.

### 5.4 `FinishParkingSessionAppService` (vehicle.exited)

- Sessao: `findActiveByPlate(plate)` quando plate existe.
- Fallback: `findMostRecentActive(parkingLotId)` (cobre `plate=null` ou casos
  de race condition em que a placa ja foi limpa).
- Throw `ActiveSessionNotFoundError` se nenhum encontrar.
- `session.finish({exitAt})` — defensivamente libera spot se ainda estiver
  ocupado.

---

## 6. Modelo de Dados (Postgres)

```mermaid
erDiagram
    drivers ||--o{ vehicles : "owns (nullable)"
    parking_lots ||--o{ parking_spots : "contains"
    parking_lots ||--o{ vehicles : "registered_in"
    parking_lots ||--o{ parking_sessions : "scoped_to"
    vehicles ||--o{ parking_sessions : "uses (nullable)"
    parking_spots ||--o{ parking_sessions : "occupied_by"

    parking_sessions {
        uuid id PK
        uuid parking_lot_id FK
        uuid vehicle_id FK "nullable"
        uuid spot_id FK "nullable"
        session_status status
        timestamptz entry_at
        timestamptz spot_released_at "nullable"
        timestamptz exit_at "nullable"
    }
```

`parking_sessions.vehicle_id` agora e nullable. `parking_lot_id` adicionado para
suportar `findOldestPendingVehicle(parkingLotId)`.

Indices criticos:
- `(parking_lot_id, status, entry_at ASC)` — usado por `findOldestPendingVehicle`
  e `findMostRecentActive`.
- `(vehicle_id, status)` — usado por `findActiveByPlate` (JOIN com vehicles).
- `(spot_id, status)` — usado por `findActiveBySpot`.

Migrations:
- `20260501022615_start_parking` — schema inicial
- `20260503172501_session_pending_vehicle` — adiciona `parking_lot_id`, torna
  `vehicle_id` nullable, novos indices

---

## 7. Estrutura de Codigo

```
src/
├── domain/parking/
│   ├── aggregates/parking-session/
│   │   ├── parking-session.ts                    # vehicle nullable, parkingLotId, assignVehicle
│   │   ├── events/                               # 6 eventos com vehicleId/licensePlate nullable
│   │   └── parking-session.spec.ts               # 28 unit tests
│   ├── entities/{driver,parking-lot,parking-spot,vehicle}.ts
│   ├── value-objects/                            # 5 VOs
│   ├── errors/                                   # 8 domain errors (incl. SessionAlreadyHasVehicle)
│   ├── repositories/                             # 5 interfaces (com findOldestPendingVehicle)
│   └── __tests__/factories/
│
├── app/
│   ├── shared/app-service.ts
│   ├── dto/types.ts                              # symbols DI
│   ├── services/
│   │   ├── parking-lot-resolver.ts
│   │   └── parking/                              # 4 App Services + .spec.ts
│   ├── handlers/recognition/                     # 4 handlers
│   ├── messaging/                                # contratos do barramento
│   ├── exceptions/recognition/                   # 3 exceptions
│   └── tests/
│       ├── in-memory-repositories/               # 3 fakes
│       └── factories/
│
└── infra/
    ├── controllers/                              # Health + RecognitionEvents + zod schema
    ├── database/
    │   ├── Connection.ts                         # Kysely<DB>
    │   ├── seed.ts
    │   ├── prisma/schema.prisma                  # 5 modelos
    │   └── kysely/{mappers,repositories}/        # 3 mappers + 3 repos
    ├── messaging/rabbitmq/                       # connection, topology, publisher, consumer
    ├── events/logger-domain-event-publisher.ts
    ├── services/env-parking-lot-resolver.ts
    ├── server/{index.ts,error-handler.ts}
    ├── env/environment.ts
    └── di/                                       # 6 modulos de bind
```

---

## 8. Cobertura de Testes (revisao 2)

| Tipo | Quantidade | Arquivos |
|---|---:|---|
| **Unit (dominio)** | 38 | `parking-session.spec.ts` (28), `license-plate-vo.spec.ts` (10) |
| **Unit (app services)** | 22 | 4 specs em `app/services/parking/` |
| **Integration (Postgres)** | 20 | 3 specs em `infra/database/kysely/repositories/` |
| **Integration (RabbitMQ)** | 2 | `recognition-flow.integration.spec.ts` |
| **Total** | **82** | — |

Comandos:
```bash
pnpm test              # unit
pnpm test:integration  # integration (precisa Postgres + RabbitMQ rodando)
pnpm test:all          # ambos
pnpm pr                # test + lint + typecheck + build
```

---

## 9. Smoke E2E (cenario real do Raspberry)

Setup:
```bash
docker compose up -d
pnpm migrate           # cria 20260503172501_session_pending_vehicle
pnpm generate
pnpm seed              # 1 ParkingLot + 2 spots (A,B)
pnpm dev
```

Cenario simulando o `vehicle-service` (note `plate=null` em `vehicle.entered`):

```bash
curl -X POST localhost:3000/events -H 'Content-Type: application/json' \
  -d '{"event":"vehicle.entered","plate":null,"timestamp":"2026-05-03T10:00:00Z"}'
# 202 — sessao PENDENTE criada (vehicle_id=NULL, spot_id=NULL)

curl -X POST localhost:3000/events -H 'Content-Type: application/json' \
  -d '{"event":"spot.occupied","spot_id":"A","plate":"ABC1D23","confidence":0.95,"timestamp":"2026-05-03T10:00:30Z"}'
# 202 — Vehicle ABC1D23 auto-criado; sessao pendente recebe vehicle + spot

curl -X POST localhost:3000/events -H 'Content-Type: application/json' \
  -d '{"event":"spot.released","spot_id":"A","plate":"ABC1D23","timestamp":"2026-05-03T11:00:00Z"}'
# 202 — spot A volta a FREE; spotReleasedAt preenchido; sessao ainda ACTIVE

curl -X POST localhost:3000/events -H 'Content-Type: application/json' \
  -d '{"event":"vehicle.exited","plate":"ABC1D23","timestamp":"2026-05-03T11:00:30Z"}'
# 202 — sessao FINISHED com exit_at preenchido
```

Resultado validado em 2026-05-03 com fluxo realistic:

| Verificacao | Esperado | Observado |
|---|---|---|
| HTTP responses | 4× `202 {accepted:true}` | OK |
| Filas RabbitMQ | todas zeradas | OK |
| DLQs | todas vazias | OK |
| `parking_sessions` | 1 linha FINISHED, vehicle_id e spot_id setados ao final, `entry_at`/`spot_released_at`/`exit_at` preenchidos | OK |
| `vehicles` | `ABC1D23` com `driver_id NULL` (anonimo) | OK |
| `parking_spots` `A` | `status=FREE` | OK |
| Domain events | 6 emitidos: `vehicle-entered`(plate=null) → `started`(plate=null) → `spot-occupied`(plate=ABC) → `spot-released` → `vehicle-exited`(plate=ABC) → `finished`(plate=ABC) | OK |

---

## 10. Configuracao

### Env vars
```
DATABASE_URL=postgresql://parking:parking@localhost:5432/parking
RABBITMQ_URL=amqp://guest:guest@localhost:5672
RABBITMQ_RECOGNITION_EXCHANGE=recognition.events
RABBITMQ_PREFETCH=10
DEFAULT_PARKING_LOT_ID=11111111-1111-4111-8111-111111111111
```

### Servicos do `docker-compose.yml`
- `parking-postgres` (postgres:16-alpine) :5432
- `parking-rabbitmq` (rabbitmq:3-management-alpine) :5672 + UI :15672

---

## 11. Decisoes de Design

### 11.1 Sessao pendente em vez de `Vehicle` obrigatorio
**Por que:** o `vehicle-service` nao tem como descobrir a placa antes do
spot-level recognition. Forcar `vehicle.entered` a ter placa exigiria reordenar
o loop do Raspberry. Aceitar `vehicle=null` na sessao e fechar com
`assignVehicle` no `spot.occupied` deixa o parking flexivel ao contrato real.

### 11.2 Correlator: ordem temporal por parking lot
**Por que:** sem `trackingId` no contrato e sem placa no `vehicle.entered`, a
unica forma de associar `vehicle.entered` a `spot.occupied` posterior e por
**ordem temporal** (FIFO por estacionamento). `findOldestPendingVehicle`
implementa isso. Limita a um vehicle entrando por vez por estacionamento — ok
no MVP single-tenant. Quando `trackingId` for adicionado ao
`vehicle-service`, basta trocar a query.

### 11.3 4 eventos NAO sao redundantes
- `vehicle.entered`: chegada ao perimetro (sem placa).
- `spot.occupied`: traz placa + spot_id + confidence.
- `spot.released`: vaga liberada, veiculo ainda no perimetro.
- `vehicle.exited`: saida final do perimetro.

### 11.4 `/events` e dumb
Controller so valida com Zod e republica em RabbitMQ. NAO chama App Service direto.
Decoupling, retry/DLQ, ordering por routing key.

### 11.5 `App Services` x `Use Cases`
- `app/services/` (bind em `Services.ts`) — orquestradores chamados pelos handlers.
- `app/usecases/` reservado para fluxos administrativos manuais (sprint futura).

---

## 12. Limitacoes Conhecidas e Proximos Passos

### Cenarios degradados ja tratados
| Cenario | Comportamento |
|---|---|
| `vehicle.entered` com `plate=null` | cria sessao pendente — OK |
| `spot.occupied` com `plate=null` | DLQ (`InvalidRecognitionPlateError`) |
| `spot.occupied` sem sessao pendente | cria sessao via `enter()` no mesmo passo |
| `vehicle.exited` com `plate=null` | fallback `findMostRecentActive` |
| `spot.released` sem sessao | DLQ |
| Duplicata `vehicle.entered` (mesma placa) | descartada (`duplicate-discarded`) |
| `finish()` sem `releaseSpot` previo | aggregate libera spot defensivamente |
| Falha do handler | retry 3x; depois DLQ |

### Limitacoes
- **Drive-through sem OCR**: se o veiculo entra e sai sem nunca parar em vaga,
  a sessao termina com `vehicle_id=null`. Documenta a passagem mas nao
  identifica o veiculo.
- **Two pendings concorrentes**: se dois veiculos entram em sequencia muito
  rapida antes do spot-level identificar nenhum, a ordem FIFO pode atribuir a
  placa errada. Inviavel sem `trackingId` ou multi-camera context.

### Fora do escopo desta sprint
- CRUD HTTP de Driver/Vehicle/ParkingLot/ParkingSpot.
- Auth.
- Frontend.
- `trackingId` no `vehicle-service` (eliminaria a heuristica FIFO).
- Roteamento por `camera_id` quando o vehicle-service enviar.
- Substituir `LoggerDomainEventPublisher` por publisher RabbitMQ (Sprint 6).
