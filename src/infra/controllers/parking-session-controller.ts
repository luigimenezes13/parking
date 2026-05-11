import { type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify';
import { inject, injectable } from 'inversify';
import { z } from 'zod/v4';

import { GetParkingSessionByIdUseCase } from '@app/usecases/parking-session/get-parking-session-by-id-usecase.ts';
import { ListActiveSessionsByLotUseCase } from '@app/usecases/parking-session/list-active-sessions-by-lot-usecase.ts';
import { ListSessionsByVehicleUseCase } from '@app/usecases/parking-session/list-sessions-by-vehicle-usecase.ts';
import { ForceFinishSessionUseCase } from '@app/usecases/parking-session/force-finish-session-usecase.ts';
import { ForcePlateSessionUseCase } from '@app/usecases/parking-session/force-plate-session-usecase.ts';
import { parkingSessionPresenter } from '@infra/controllers/parking-session-presenter.ts';

const sessionIdParamSchema = z.object({
  id: z.uuid(),
});

const lotIdParamSchema = z.object({
  lotId: z.uuid(),
});

const vehicleIdParamSchema = z.object({
  vehicleId: z.uuid(),
});

const forceFinishBodySchema = z
  .object({
    exitAt: z.iso.datetime().optional(),
  })
  .optional();

const forcePlateBodySchema = z.object({
  plate: z.string().min(7).max(8),
});

@injectable()
export class ParkingSessionController {
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
    this.getParkingSessionById = getParkingSessionById;
    this.listActiveSessionsByLot = listActiveSessionsByLot;
    this.listSessionsByVehicle = listSessionsByVehicle;
    this.forceFinishSession = forceFinishSession;
    this.forcePlateSession = forcePlateSession;
  }

  register(server: FastifyInstance): void {
    server.get('/parking-sessions/:id', this.handleGetById.bind(this));
    server.get('/parking-lots/:lotId/active-sessions', this.handleListActiveByLot.bind(this));
    server.get('/vehicles/:vehicleId/sessions', this.handleListByVehicle.bind(this));
    server.post('/parking-sessions/:id/force-finish', this.handleForceFinish.bind(this));
    server.post('/parking-sessions/:id/force-plate', this.handleForcePlate.bind(this));
  }

  private async handleGetById(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const parsed = sessionIdParamSchema.safeParse(request.params);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'invalid_payload', details: parsed.error.format() });
    }

    const session = await this.getParkingSessionById.execute({ sessionId: parsed.data.id });
    return reply.status(200).send(parkingSessionPresenter.toResponse(session));
  }

  private async handleListActiveByLot(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const parsed = lotIdParamSchema.safeParse(request.params);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'invalid_payload', details: parsed.error.format() });
    }

    const items = await this.listActiveSessionsByLot.execute({
      parkingLotId: parsed.data.lotId,
    });
    return reply.status(200).send(items.map((item) => parkingSessionPresenter.toResponse(item)));
  }

  private async handleListByVehicle(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const parsed = vehicleIdParamSchema.safeParse(request.params);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'invalid_payload', details: parsed.error.format() });
    }

    const items = await this.listSessionsByVehicle.execute({ vehicleId: parsed.data.vehicleId });
    return reply.status(200).send(items.map((item) => parkingSessionPresenter.toResponse(item)));
  }

  private async handleForceFinish(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const params = sessionIdParamSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: 'invalid_payload', details: params.error.format() });
    }

    const body = forceFinishBodySchema.safeParse(request.body ?? {});
    if (!body.success) {
      return reply.status(400).send({ error: 'invalid_payload', details: body.error.format() });
    }

    const exitAt = body.data?.exitAt ? new Date(body.data.exitAt) : undefined;
    const session = await this.forceFinishSession.execute({
      sessionId: params.data.id,
      exitAt,
    });
    return reply.status(200).send(parkingSessionPresenter.toResponse(session));
  }

  private async handleForcePlate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const params = sessionIdParamSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: 'invalid_payload', details: params.error.format() });
    }

    const body = forcePlateBodySchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'invalid_payload', details: body.error.format() });
    }

    const session = await this.forcePlateSession.execute({
      sessionId: params.data.id,
      plate: body.data.plate,
    });
    return reply.status(200).send(parkingSessionPresenter.toResponse(session));
  }
}
