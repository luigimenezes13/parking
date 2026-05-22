import { type FastifyReply, type FastifyRequest } from 'fastify';
import { inject, injectable } from 'inversify';
import { z } from 'zod/v4';

import { ListActivityEventsUseCase } from '@app/usecases/activity/list-activity-events-usecase.ts';
import { GetActivityDaySummaryUseCase } from '@app/usecases/activity/get-activity-day-summary-usecase.ts';
import {
  ActivityTypeVO,
  type ActivityTypeValue,
} from '@domain/activity/value-objects/activity-type-vo.ts';
import { activityEventPresenter } from '@infra/controllers/activity-event-presenter.ts';
import { FastifyController } from '@infra/http/fastify-controller.ts';
import {
  ApiOperation,
  ApiParamsSchema,
  ApiQueryParamsSchema,
  ApiResponseSchema,
  ApiTag,
  Route,
} from '@infra/http/decorators/index.ts';

const lotIdParamSchema = z.object({ lotId: z.uuid() });

const isoDateString = z.string().datetime({ offset: true });
const isoDateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/u, 'must be YYYY-MM-DD');

const activityTypeSchema = z.enum(ActivityTypeVO.all() as [string, ...string[]]);

const listActivityEventsQuerySchema = z.object({
  from: isoDateString.optional(),
  to: isoDateString.optional(),
  type: z.union([activityTypeSchema, z.array(activityTypeSchema)]).optional(),
  plate: z.string().min(1).optional(),
  spotId: z.uuid().optional(),
  vehicleId: z.uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
});

const activityEventResponseSchema = z.object({
  id: z.uuid(),
  parkingLotId: z.uuid(),
  sessionId: z.uuid().nullable(),
  vehicleId: z.uuid().nullable(),
  spotId: z.uuid().nullable(),
  cameraId: z.uuid().nullable(),
  type: z.string(),
  payload: z.record(z.string(), z.unknown()),
  occurredAt: z.string(),
});

const listActivityEventsResponseSchema = z.object({
  items: z.array(activityEventResponseSchema),
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
});

const summaryQuerySchema = z.object({
  date: isoDateOnly,
});

const summaryResponseSchema = z.object({
  date: z.string(),
  entries: z.number().int(),
  exits: z.number().int(),
  spotsOccupied: z.number().int(),
  spotsReleased: z.number().int(),
  manualActions: z.number().int(),
});

@injectable()
export class ActivityController extends FastifyController {
  private readonly listActivityEvents: ListActivityEventsUseCase;
  private readonly getActivityDaySummary: GetActivityDaySummaryUseCase;

  constructor(
    @inject(ListActivityEventsUseCase) listActivityEvents: ListActivityEventsUseCase,
    @inject(GetActivityDaySummaryUseCase)
    getActivityDaySummary: GetActivityDaySummaryUseCase,
  ) {
    super();
    this.listActivityEvents = listActivityEvents;
    this.getActivityDaySummary = getActivityDaySummary;
  }

  @ApiTag('Activity')
  @ApiOperation('Listar eventos de atividade do estacionamento')
  @ApiParamsSchema(lotIdParamSchema)
  @ApiQueryParamsSchema(listActivityEventsQuerySchema)
  @ApiResponseSchema({ 200: listActivityEventsResponseSchema })
  @Route('get', '/parking-lots/:lotId/activity-events')
  async listActivityEventsHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { lotId } = request.params as { lotId: string };
    const parsedQuery = listActivityEventsQuerySchema.parse(request.query ?? {});
    const types: ActivityTypeValue[] | undefined = parsedQuery.type
      ? (Array.isArray(parsedQuery.type) ? parsedQuery.type : [parsedQuery.type]).map(
          (value) => value as ActivityTypeValue,
        )
      : undefined;

    const result = await this.listActivityEvents.execute({
      parkingLotId: lotId,
      from: parsedQuery.from ? new Date(parsedQuery.from) : undefined,
      to: parsedQuery.to ? new Date(parsedQuery.to) : undefined,
      types,
      plate: parsedQuery.plate,
      spotId: parsedQuery.spotId,
      vehicleId: parsedQuery.vehicleId,
      page: parsedQuery.page,
      pageSize: parsedQuery.pageSize,
    });

    return reply.status(200).send({
      items: result.items.map((item) => activityEventPresenter.toResponse(item)),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    });
  }

  @ApiTag('Activity')
  @ApiOperation('Resumo diário de atividades')
  @ApiParamsSchema(lotIdParamSchema)
  @ApiQueryParamsSchema(summaryQuerySchema)
  @ApiResponseSchema({ 200: summaryResponseSchema })
  @Route('get', '/parking-lots/:lotId/activity-summary')
  async summaryHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { lotId } = request.params as { lotId: string };
    const { date } = summaryQuerySchema.parse(request.query ?? {});

    const result = await this.getActivityDaySummary.execute({
      parkingLotId: lotId,
      date: new Date(`${date}T00:00:00.000Z`),
    });

    return reply.status(200).send(result);
  }
}
