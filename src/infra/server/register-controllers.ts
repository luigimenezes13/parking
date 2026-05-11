import { type FastifyInstance } from 'fastify';
import { type Container } from 'inversify';

import { TYPES } from '@app/dto/types.ts';
import { RegisterController } from '@infra/http/register-controller.ts';

export function registerControllers(server: FastifyInstance, container: Container): void {
  const controllers = container.getAll<object>(TYPES.Controller);
  for (const controller of controllers) {
    RegisterController(server, controller);
  }
}
