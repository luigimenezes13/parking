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
import { database } from '@infra/database/Connection.ts';

const environment = loadEnvironment();
const server = Fastify({ logger: true });

await server.register(cors);
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

const healthController = container.get(HealthController);
healthController.register(server);

const recognitionEventsController = container.get(RecognitionEventsController);
recognitionEventsController.register(server);

const driverController = container.get(DriverController);
driverController.register(server);

const parkingLotController = container.get(ParkingLotController);
parkingLotController.register(server);

const vehicleController = container.get(VehicleController);
vehicleController.register(server);

const parkingSpotController = container.get(ParkingSpotController);
parkingSpotController.register(server);

registerErrorHandler(server);

await server.listen({ port: environment.PORT, host: '0.0.0.0' });

async function shutdown(signal: string): Promise<void> {
  server.log.info({ signal }, 'shutdown.start');
  try {
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
