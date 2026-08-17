import 'reflect-metadata';
import 'dotenv/config';

import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

import { container } from '@infra/di/Container.ts';
import { TYPES } from '@app/dto/types.ts';
import { HealthController } from '@infra/controllers/HealthController.ts';
import { RecognitionEventsController } from '@infra/controllers/RecognitionEventsController.ts';
import { DriverController } from '@infra/controllers/driver-controller.ts';
import { ParkingLotController } from '@infra/controllers/parking-lot-controller.ts';
import { VehicleController } from '@infra/controllers/vehicle-controller.ts';
import { ParkingSpotController } from '@infra/controllers/parking-spot-controller.ts';
import { ParkingSessionController } from '@infra/controllers/parking-session-controller.ts';
import { CameraController } from '@infra/controllers/camera-controller.ts';
import { ActivityController } from '@infra/controllers/activity-controller.ts';
import { ActivityStreamController } from '@infra/controllers/activity-stream-controller.ts';
import { RegisterController } from '@infra/http/register-controller.ts';
import { registerErrorHandler } from '@infra/server/error-handler.ts';
import { loadEnvironment } from '@infra/env/environment.ts';
import {
  closeRabbitMQConnection,
  getRabbitMQConnection,
} from '@infra/messaging/rabbitmq/connection.ts';
import {
  buildRecognitionTopology,
  declareRecognitionTopology,
} from '@infra/messaging/rabbitmq/topology.ts';
import {
  RABBITMQ_TYPES,
  RabbitMQRecognitionEventPublisher,
} from '@infra/messaging/rabbitmq/rabbitmq-recognition-event-publisher.ts';
import {
  type RecognitionConsumerBinding,
  startRecognitionConsumers,
} from '@infra/messaging/rabbitmq/recognition-event-consumer.ts';
import { type RecognitionEventPublisher } from '@app/messaging/recognition-event-publisher.ts';
import { type VehicleEnteredHandler } from '@app/handlers/recognition/vehicle-entered-handler.ts';
import { type SpotOccupiedHandler } from '@app/handlers/recognition/spot-occupied-handler.ts';
import { type SpotReleasedHandler } from '@app/handlers/recognition/spot-released-handler.ts';
import { type VehicleExitedHandler } from '@app/handlers/recognition/vehicle-exited-handler.ts';
import { type ActivityRecorderAppService } from '@app/services/activity/activity-recorder.app-service.ts';
import { type DomainEventBus } from '@infra/events/in-process-domain-event-bus.ts';
import { OfflineCameraSweeper } from '@infra/jobs/offline-camera-sweeper.ts';
import { ExitConfirmationSweeper } from '@infra/jobs/exit-confirmation-sweeper.ts';
import { database } from '@infra/database/Connection.ts';

const environment = loadEnvironment();
const server = Fastify({
  logger: true,
  // discriminatedUnion gera \`oneOf\` com branches que possuem
  // \`additionalProperties:false\`. Com o \`removeAdditional\` ligado (default do
  // Ajv do Fastify) propriedades especificas de uma branch sao removidas
  // enquanto o Ajv testa as anteriores no oneOf, e a branch correta acaba
  // falhando por "required property faltando".
  ajv: { customOptions: { removeAdditional: false } },
});

// Sem `methods` explicito o preflight responde apenas GET,HEAD,POST e o
// navegador bloqueia PATCH/DELETE — o dashboard perde atribuir motorista,
// editar vaga e editar camera.
await server.register(cors, {
  methods: ['GET', 'HEAD', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
});
await server.register(swagger, {
  openapi: {
    info: {
      title: 'Parking API',
      version: '0.0.1',
      description: 'API de gerenciamento de estacionamento',
    },
  },
});
await server.register(swaggerUi, { routePrefix: '/docs' });

const rabbitConnection = await getRabbitMQConnection();
const rabbitChannel = await rabbitConnection.createChannel();
const topology = buildRecognitionTopology(environment.RABBITMQ_RECOGNITION_EXCHANGE);
await declareRecognitionTopology(rabbitChannel, topology);

container.bind(RABBITMQ_TYPES.Channel).toConstantValue(rabbitChannel);
container.bind(RABBITMQ_TYPES.Topology).toConstantValue(topology);
container
  .bind<RecognitionEventPublisher>(TYPES.RecognitionEventPublisher)
  .to(RabbitMQRecognitionEventPublisher)
  .inSingletonScope();

const consumers: RecognitionConsumerBinding[] = [
  {
    queue: topology.queues.find((q) => q.routingKey === 'vehicle.entered')!.queue,
    handler: (payload) =>
      container.get<VehicleEnteredHandler>(TYPES.VehicleEnteredHandler).handle(payload),
  },
  {
    queue: topology.queues.find((q) => q.routingKey === 'spot.occupied')!.queue,
    handler: (payload) =>
      container.get<SpotOccupiedHandler>(TYPES.SpotOccupiedHandler).handle(payload),
  },
  {
    queue: topology.queues.find((q) => q.routingKey === 'spot.released')!.queue,
    handler: (payload) =>
      container.get<SpotReleasedHandler>(TYPES.SpotReleasedHandler).handle(payload),
  },
  {
    queue: topology.queues.find((q) => q.routingKey === 'vehicle.exited')!.queue,
    handler: (payload) =>
      container.get<VehicleExitedHandler>(TYPES.VehicleExitedHandler).handle(payload),
  },
];
await startRecognitionConsumers(rabbitChannel, consumers, environment.RABBITMQ_PREFETCH);

const activityRecorder = container.get<ActivityRecorderAppService>(
  TYPES.ActivityRecorderAppService,
);
const domainEventBus = container.get<DomainEventBus>(TYPES.DomainEventBus);
const unsubscribeActivityRecorder = domainEventBus.subscribe((event) => {
  void activityRecorder.handle(event);
});

const offlineCameraSweeper = container.get(OfflineCameraSweeper);
offlineCameraSweeper.start();

const exitConfirmationSweeper = container.get(ExitConfirmationSweeper);
exitConfirmationSweeper.start({ graceAfterMs: environment.SESSION_EXIT_GRACE_MS });

// TODO: add this to the DI
RegisterController(server, container.get(HealthController));
RegisterController(server, container.get(RecognitionEventsController));
RegisterController(server, container.get(DriverController));
RegisterController(server, container.get(ParkingLotController));
RegisterController(server, container.get(VehicleController));
RegisterController(server, container.get(ParkingSpotController));
RegisterController(server, container.get(ParkingSessionController));
RegisterController(server, container.get(CameraController));
RegisterController(server, container.get(ActivityController));
RegisterController(server, container.get(ActivityStreamController));

registerErrorHandler(server);

await server.listen({ port: environment.PORT, host: '0.0.0.0' });

async function shutdown(signal: string): Promise<void> {
  server.log.info({ signal }, 'shutdown.start');
  try {
    offlineCameraSweeper.stop();
    exitConfirmationSweeper.stop();
    unsubscribeActivityRecorder();
    await server.close();
    await rabbitChannel.close().catch(() => undefined);
    await closeRabbitMQConnection();
    await database.destroy();
    server.log.info('shutdown.complete');
    process.exit(0);
  } catch (error) {
    server.log.error({ err: error }, 'shutdown.failed');
    process.exit(1);
  }
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
