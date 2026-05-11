import { type FastifyReply, type FastifyRequest } from 'fastify';
import { inject, injectable } from 'inversify';
import { z } from 'zod/v4';

import { GetParkingSessionByIdUseCase } from '@app/usecases/parking-session/get-parking-session-by-id-usecase.ts';
import { ListActiveSessionsByLotUseCase } from '@app/usecases/parking-session/list-active-sessions-by-lot-usecase.ts';
import { ListSessionsByVehicleUseCase } from '@app/usecases/parking-session/list-sessions-by-vehicle-usecase.ts';
import { ForceFinishSessionUseCase } from '@app/usecases/parking-session/force-finish-session-usecase.ts';
import { ForcePlateSessionUseCase } from '@app/usecases/parking-session/force-plate-session-usecase.ts';
import {
  ForcePlateSessionRequest,
  ForcePlateSessionRequestSchema,
  type ForcePlateSessionRequestDTO,
} from '@app/dto/inputs/parking-session/force-plate-session-input.ts';
import {
  ForceFinishSessionRequest,
  ForceFinishSessionRequestSchema,
  type ForceFinishSessionRequestDTO,
} from '@app/dto/inputs/parking-session/force-finish-session-input.ts';
import { parkingSessionPresenter } from '@infra/controllers/parking-session-presenter.ts';
import { FastifyController } from '@infra/http/fastify-controller.ts';
import {
  ApiBodySchema,
  ApiOperation,
  ApiParamsSchema,
  ApiResponseSchema,
  ApiTag,
  Route,
} from '@infra/http/decorators/index.ts';

const sessionIdParamSchema = z.object({ id: z.uuid() });
const lotIdParamSchema = z.object({ lotId: z.uuid() });
const vehicleIdParamSchema = z.object({ vehicleId: z.uuid() });

const parkingSessionResponseSchema = z.object({
  id: z.uuid(),
  parkingLotId: z.uuid(),
  vehicleId: z.uuid().nullable(),
  licensePlate: z.string().nullable(),
  spotId: z.uuid().nullable(),
  spotCode: z.string().nullable(),
  status: z.string(),
  entryAt: z.string(),
  spotReleasedAt: z.string().nullable(),
  exitAt: z.string().nullable(),
});

@injectable()
export class ParkingSessionController extends FastifyController {
  private readonly getParkingSessionById: GetParkingSessionByIdUseCase;
  private readonly listActiveSessionsByLot: ListActiveSessionsByLotUseCase;
  private readonly listSessionsByVehicle: ListSessionsByVehicleUseCase;
  private readonly forceFinishSession: ForceFinishSessionUseCase;
  private readonly forcePlateSession: ForcePlateSessionUseCase;

  constructor(
    @inject(GetParkingSessionByIdUseCase) getParkingSessionById: GetParkingSessionByIdUseCase,
    @inject(ListActiveSessionsByLotUseCase)
    listActiveSessionsByLot: ListActiveSessionsByLotUseCase,
    @inject(ListSessionsByVehicleUseCase) listSessionsByVehicle: ListSessionsByVehicleUseCase,
    @inject(ForceFinishSessionUseCase) forceFinishSession: ForceFinishSessionUseCase,
    @inject(ForcePlateSessionUseCase) forcePlateSession: ForcePlateSessionUseCase,
  ) {
    super();
    this.getParkingSessionById = getParkingSessionById;
    this.listActiveSessionsByLot = listActiveSessionsByLot;
    this.listSessionsByVehicle = listSessionsByVehicle;
    this.forceFinishSession = forceFinishSession;
    this.forcePlateSession = forcePlateSession;
  }

  @ApiTag('ParkingSessions')
  @ApiOperation('Buscar sessao por id')
  @ApiParamsSchema(sessionIdParamSchema)
  @ApiResponseSchema({ 200: parkingSessionResponseSchema })
  @Route('get', '/parking-sessions/:id')
  async getParkingSessionByIdHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = request.params as { id: string };
    const session = await this.getParkingSessionById.execute({ sessionId: id });
    return reply.status(200).send(parkingSessionPresenter.toResponse(session));
  }

  @ApiTag('ParkingSessions')
  @ApiOperation('Listar sessoes ativas do estacionamento')
  @ApiParamsSchema(lotIdParamSchema)
  @ApiResponseSchema({ 200: z.array(parkingSessionResponseSchema) })
  @Route('get', '/parking-lots/:lotId/active-sessions')
  async listActiveSessionsByLotHandler(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const { lotId } = request.params as { lotId: string };
    const items = await this.listActiveSessionsByLot.execute({ parkingLotId: lotId });
    return reply.status(200).send(items.map((item) => parkingSessionPresenter.toResponse(item)));
  }

  @ApiTag('ParkingSessions')
  @ApiOperation('Listar sessoes do veiculo')
  @ApiParamsSchema(vehicleIdParamSchema)
  @ApiResponseSchema({ 200: z.array(parkingSessionResponseSchema) })
  @Route('get', '/vehicles/:vehicleId/sessions')
  async listSessionsByVehicleHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { vehicleId } = request.params as { vehicleId: string };
    const items = await this.listSessionsByVehicle.execute({ vehicleId });
    return reply.status(200).send(items.map((item) => parkingSessionPresenter.toResponse(item)));
  }

  @ApiTag('ParkingSessions')
  @ApiOperation('Forcar finalizacao da sessao')
  @ApiParamsSchema(sessionIdParamSchema)
  @ApiBodySchema(ForceFinishSessionRequestSchema)
  @ApiResponseSchema({ 200: parkingSessionResponseSchema })
  @Route('post', '/parking-sessions/:id/force-finish')
  async forceFinishSessionHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = request.params as { id: string };
    const body = (request.body ?? {}) as Omit<ForceFinishSessionRequestDTO, 'sessionId'>;
    const dto = new ForceFinishSessionRequest({ sessionId: id, ...body });
    const session = await this.forceFinishSession.execute(dto);
    return reply.status(200).send(parkingSessionPresenter.toResponse(session));
  }

  @ApiTag('ParkingSessions')
  @ApiOperation('Forcar placa da sessao')
  @ApiParamsSchema(sessionIdParamSchema)
  @ApiBodySchema(ForcePlateSessionRequestSchema)
  @ApiResponseSchema({ 200: parkingSessionResponseSchema })
  @Route('post', '/parking-sessions/:id/force-plate')
  async forcePlateSessionHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = request.params as { id: string };
    const body = request.body as Omit<ForcePlateSessionRequestDTO, 'sessionId'>;
    const dto = new ForcePlateSessionRequest({ sessionId: id, ...body });
    const session = await this.forcePlateSession.execute(dto);
    return reply.status(200).send(parkingSessionPresenter.toResponse(session));
  }
}
