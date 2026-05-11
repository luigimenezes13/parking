import { type FastifyReply, type FastifyRequest } from 'fastify';
import { injectable } from 'inversify';
import { z } from 'zod/v4';

import { FastifyController } from '@infra/http/fastify-controller.ts';
import { ApiOperation, ApiResponseSchema, ApiTag, Route } from '@infra/http/decorators/index.ts';

const healthResponseSchema = z.object({ status: z.literal('ok') });

@injectable()
export class HealthController extends FastifyController {
  @ApiTag('Health')
  @ApiOperation('Health check')
  @ApiResponseSchema({ 200: healthResponseSchema })
  @Route('get', '/health')
  async health(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    return reply.status(200).send({ status: 'ok' });
  }
}
