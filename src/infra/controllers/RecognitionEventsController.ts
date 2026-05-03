import { type FastifyInstance } from 'fastify';
import { inject, injectable } from 'inversify';

import { type RecognitionEventPublisher } from '@app/messaging/recognition-event-publisher.ts';
import { TYPES } from '@app/dto/types.ts';
import { recognitionEventSchema } from '@infra/controllers/recognition/event-payload.schema.ts';

@injectable()
export class RecognitionEventsController {
  private readonly publisher: RecognitionEventPublisher;

  constructor(@inject(TYPES.RecognitionEventPublisher) publisher: RecognitionEventPublisher) {
    this.publisher = publisher;
  }

  register(server: FastifyInstance): void {
    server.post('/events', async (request, reply) => {
      const parsed = recognitionEventSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.status(400).send({
          error: 'invalid_payload',
          details: parsed.error.format(),
        });
      }

      await this.publisher.publish(parsed.data);
      return reply.status(202).send({ accepted: true });
    });
  }
}
