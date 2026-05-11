import { type FastifyReply, type FastifyRequest } from 'fastify';
import { inject, injectable } from 'inversify';
import { z } from 'zod/v4';

import { type RecognitionEventPublisher } from '@app/messaging/recognition-event-publisher.ts';
import { TYPES } from '@app/dto/types.ts';
import {
  RecognitionEventRequest,
  RecognitionEventRequestSchema,
  type RecognitionEventRequestDTO,
} from '@app/dto/inputs/recognition/recognition-event-input.ts';
import { FastifyController } from '@infra/http/fastify-controller.ts';
import {
  ApiBodySchema,
  ApiOperation,
  ApiResponseSchema,
  ApiTag,
  Route,
} from '@infra/http/decorators/index.ts';

const acceptedResponseSchema = z.object({ accepted: z.literal(true) });

@injectable()
export class RecognitionEventsController extends FastifyController {
  private readonly publisher: RecognitionEventPublisher;

  constructor(@inject(TYPES.RecognitionEventPublisher) publisher: RecognitionEventPublisher) {
    super();
    this.publisher = publisher;
  }

  @ApiTag('Recognition')
  @ApiOperation('Receber evento de reconhecimento (placa, vaga, etc.)')
  @ApiBodySchema(RecognitionEventRequestSchema)
  @ApiResponseSchema({ 202: acceptedResponseSchema })
  @Route('post', '/events')
  async publishEvent(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const dto = new RecognitionEventRequest(request.body as RecognitionEventRequestDTO);
    await this.publisher.publish(dto.props);
    return reply.status(202).send({ accepted: true });
  }
}
