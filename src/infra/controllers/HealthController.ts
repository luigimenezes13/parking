import { injectable } from 'inversify';
import { type FastifyInstance } from 'fastify';

@injectable()
export class HealthController {
  register(server: FastifyInstance): void {
    server.get('/health', async () => {
      return { status: 'ok' };
    });
  }
}
