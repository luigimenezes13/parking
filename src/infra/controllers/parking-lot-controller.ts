import { type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify';
import { inject, injectable } from 'inversify';
import { z } from 'zod/v4';

import { CreateParkingLotUseCase } from '@app/usecases/parking-lot/create-parking-lot-usecase.ts';
import { GetParkingLotByIdUseCase } from '@app/usecases/parking-lot/get-parking-lot-by-id-usecase.ts';
import { ListParkingLotsUseCase } from '@app/usecases/parking-lot/list-parking-lots-usecase.ts';
import { UpdateParkingLotInfoUseCase } from '@app/usecases/parking-lot/update-parking-lot-info-usecase.ts';
import { DeactivateParkingLotUseCase } from '@app/usecases/parking-lot/deactivate-parking-lot-usecase.ts';
import { GetParkingLotMapUseCase } from '@app/usecases/parking-lot/get-parking-lot-map-usecase.ts';
import { parkingLotPresenter } from '@infra/controllers/parking-lot-presenter.ts';
import { parkingLotMapPresenter } from '@infra/controllers/parking-lot-map-presenter.ts';

const createBodySchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  totalCapacity: z.number().int().positive(),
});

const updateBodySchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  totalCapacity: z.number().int().positive(),
});

const parkingLotIdParamSchema = z.object({
  id: z.uuid(),
});

@injectable()
export class ParkingLotController {
  private readonly createParkingLot: CreateParkingLotUseCase;
  private readonly getParkingLotById: GetParkingLotByIdUseCase;
  private readonly listParkingLots: ListParkingLotsUseCase;
  private readonly updateParkingLotInfo: UpdateParkingLotInfoUseCase;
  private readonly deactivateParkingLot: DeactivateParkingLotUseCase;
  private readonly getParkingLotMap: GetParkingLotMapUseCase;

  constructor(
    @inject(CreateParkingLotUseCase) createParkingLot: CreateParkingLotUseCase,
    @inject(GetParkingLotByIdUseCase) getParkingLotById: GetParkingLotByIdUseCase,
    @inject(ListParkingLotsUseCase) listParkingLots: ListParkingLotsUseCase,
    @inject(UpdateParkingLotInfoUseCase) updateParkingLotInfo: UpdateParkingLotInfoUseCase,
    @inject(DeactivateParkingLotUseCase) deactivateParkingLot: DeactivateParkingLotUseCase,
    @inject(GetParkingLotMapUseCase) getParkingLotMap: GetParkingLotMapUseCase,
  ) {
    this.createParkingLot = createParkingLot;
    this.getParkingLotById = getParkingLotById;
    this.listParkingLots = listParkingLots;
    this.updateParkingLotInfo = updateParkingLotInfo;
    this.deactivateParkingLot = deactivateParkingLot;
    this.getParkingLotMap = getParkingLotMap;
  }

  register(server: FastifyInstance): void {
    server.post('/parking-lots', this.handleCreate.bind(this));
    server.get('/parking-lots', this.handleList.bind(this));
    server.get('/parking-lots/:id', this.handleGetById.bind(this));
    server.get('/parking-lots/:id/map', this.handleGetMap.bind(this));
    server.patch('/parking-lots/:id', this.handleUpdate.bind(this));
    server.delete('/parking-lots/:id', this.handleDeactivate.bind(this));
  }

  private async handleGetMap(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const parsed = parkingLotIdParamSchema.safeParse(request.params);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'invalid_payload', details: parsed.error.format() });
    }

    const view = await this.getParkingLotMap.execute({ parkingLotId: parsed.data.id });
    return reply.status(200).send(parkingLotMapPresenter.toResponse(view));
  }

  private async handleCreate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const parsed = createBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'invalid_payload', details: parsed.error.format() });
    }

    const result = await this.createParkingLot.execute(parsed.data);
    return reply.status(201).send({ id: result.parkingLotId });
  }

  private async handleList(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const lots = await this.listParkingLots.execute({});
    return reply.status(200).send(lots.map((lot) => parkingLotPresenter.toResponse(lot)));
  }

  private async handleGetById(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const parsed = parkingLotIdParamSchema.safeParse(request.params);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'invalid_payload', details: parsed.error.format() });
    }

    const lot = await this.getParkingLotById.execute({ parkingLotId: parsed.data.id });
    return reply.status(200).send(parkingLotPresenter.toResponse(lot));
  }

  private async handleUpdate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const params = parkingLotIdParamSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: 'invalid_payload', details: params.error.format() });
    }

    const body = updateBodySchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'invalid_payload', details: body.error.format() });
    }

    const lot = await this.updateParkingLotInfo.execute({
      parkingLotId: params.data.id,
      ...body.data,
    });
    return reply.status(200).send(parkingLotPresenter.toResponse(lot));
  }

  private async handleDeactivate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const parsed = parkingLotIdParamSchema.safeParse(request.params);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'invalid_payload', details: parsed.error.format() });
    }

    const lot = await this.deactivateParkingLot.execute({ parkingLotId: parsed.data.id });
    return reply.status(200).send(parkingLotPresenter.toResponse(lot));
  }
}
