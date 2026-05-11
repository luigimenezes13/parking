import { type FastifyInstance } from 'fastify';

export abstract class FastifyController {
  protected instance?: FastifyInstance;
}
