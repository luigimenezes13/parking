import 'reflect-metadata';

import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

import { container } from '../di/Container.ts';
import { HealthController } from '../controllers/HealthController.ts';
import { loadEnvironment } from '../env/environment.ts';

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

const healthController = container.get(HealthController);
healthController.register(server);

await server.listen({ port: environment.PORT, host: '0.0.0.0' });
