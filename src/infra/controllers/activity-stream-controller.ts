import { type FastifyReply, type FastifyRequest } from 'fastify';
import { inject, injectable } from 'inversify';
import { z } from 'zod/v4';

import { TYPES } from '@app/dto/types.ts';
import { activityEventPresenter } from '@infra/controllers/activity-event-presenter.ts';
import { FastifyController } from '@infra/http/fastify-controller.ts';
import { ApiOperation, ApiParamsSchema, ApiTag, Route } from '@infra/http/decorators/index.ts';
import { type ActivityBroadcaster } from '@infra/realtime/activity-broadcaster.ts';

const lotIdParamSchema = z.object({ lotId: z.uuid() });

const HEARTBEAT_INTERVAL_MS = 30_000;

@injectable()
export class ActivityStreamController extends FastifyController {
  private readonly broadcaster: ActivityBroadcaster;

  constructor(@inject(TYPES.ActivityBroadcaster) broadcaster: ActivityBroadcaster) {
    super();
    this.broadcaster = broadcaster;
  }

  @ApiTag('Activity')
  @ApiOperation('Stream SSE de eventos de atividade em tempo real')
  @ApiParamsSchema(lotIdParamSchema)
  @Route('get', '/parking-lots/:lotId/activity-stream')
  async streamHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { lotId } = request.params as { lotId: string };

    reply.hijack();
    const raw = reply.raw;

    raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    raw.write(': connected\n\n');

    const unsubscribe = this.broadcaster.subscribe(lotId, (event) => {
      const data = JSON.stringify(activityEventPresenter.toResponse(event));
      raw.write(`event: activity\n`);
      raw.write(`data: ${data}\n\n`);
    });

    const heartbeat = setInterval(() => {
      raw.write(': ping\n\n');
    }, HEARTBEAT_INTERVAL_MS);

    const cleanup = (): void => {
      clearInterval(heartbeat);
      unsubscribe();
      raw.end();
    };

    request.raw.on('close', cleanup);
    request.raw.on('error', cleanup);
  }
}
