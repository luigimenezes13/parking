import { type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify';
import { inject, injectable } from 'inversify';
import { z } from 'zod/v4';

import { CreateParkingSpotUseCase } from '@app/usecases/parking-spot/create-parking-spot-usecase.ts';
import { GetParkingSpotByIdUseCase } from '@app/usecases/parking-spot/get-parking-spot-by-id-usecase.ts';
import { ListParkingSpotsByLotUseCase } from '@app/usecases/parking-spot/list-parking-spots-by-lot-usecase.ts';
import { UpdateParkingSpotMetadataUseCase } from '@app/usecases/parking-spot/update-parking-spot-metadata-usecase.ts';
import { DeactivateParkingSpotUseCase } from '@app/usecases/parking-spot/deactivate-parking-spot-usecase.ts';
import { parkingSpotPresenter } from '@infra/controllers/parking-spot-presenter.ts';

const spotTypeEnum = z.enum([
  'REGULAR',
  'COMPACT',
  'LARGE',
  'MOTORCYCLE',
  'ACCESSIBLE',
  'ELECTRIC',
]);

const createBodySchema = z.object({
  code: z.string().min(1).max(16),
  floor: z.number().int(),
  row: z.number().int().positive(),
  column: z.number().int().positive(),
  isCovered: z.boolean(),
  spotType: spotTypeEnum,
});

const updateBodySchema = z.object({
  floor: z.number().int(),
  row: z.number().int().positive(),
  column: z.number().int().positive(),
  isCovered: z.boolean(),
  spotType: spotTypeEnum,
});

const spotIdParamSchema = z.object({
  id: z.uuid(),
});

const lotIdParamSchema = z.object({
  lotId: z.uuid(),
});

@injectable()
export class ParkingSpotController {
  private readonly createParkingSpot: CreateParkingSpotUseCase;
  private readonly getParkingSpotById: GetParkingSpotByIdUseCase;
  private readonly listParkingSpotsByLot: ListParkingSpotsByLotUseCase;
  private readonly updateParkingSpotMetadata: UpdateParkingSpotMetadataUseCase;
  private readonly deactivateParkingSpot: DeactivateParkingSpotUseCase;

  constructor(
    @inject(CreateParkingSpotUseCase) createParkingSpot: CreateParkingSpotUseCase,
    @inject(GetParkingSpotByIdUseCase) getParkingSpotById: GetParkingSpotByIdUseCase,
    @inject(ListParkingSpotsByLotUseCase) listParkingSpotsByLot: ListParkingSpotsByLotUseCase,
    @inject(UpdateParkingSpotMetadataUseCase)
    updateParkingSpotMetadata: UpdateParkingSpotMetadataUseCase,
    @inject(DeactivateParkingSpotUseCase) deactivateParkingSpot: DeactivateParkingSpotUseCase,
  ) {
    this.createParkingSpot = createParkingSpot;
    this.getParkingSpotById = getParkingSpotById;
    this.listParkingSpotsByLot = listParkingSpotsByLot;
    this.updateParkingSpotMetadata = updateParkingSpotMetadata;
    this.deactivateParkingSpot = deactivateParkingSpot;
  }

  register(server: FastifyInstance): void {
    server.post('/parking-lots/:lotId/spots', this.handleCreate.bind(this));
    server.get('/parking-lots/:lotId/spots', this.handleListByLot.bind(this));
    server.get('/parking-spots/:id', this.handleGetById.bind(this));
    server.patch('/parking-spots/:id', this.handleUpdate.bind(this));
    server.delete('/parking-spots/:id', this.handleDeactivate.bind(this));
  }

  private async handleCreate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const params = lotIdParamSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: 'invalid_payload', details: params.error.format() });
    }

    const body = createBodySchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'invalid_payload', details: body.error.format() });
    }

    const result = await this.createParkingSpot.execute({
      parkingLotId: params.data.lotId,
      ...body.data,
    });
    return reply.status(201).send({ id: result.parkingSpotId });
  }

  private async handleListByLot(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const parsed = lotIdParamSchema.safeParse(request.params);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'invalid_payload', details: parsed.error.format() });
    }

    const items = await this.listParkingSpotsByLot.execute({ parkingLotId: parsed.data.lotId });
    return reply.status(200).send(items.map((item) => parkingSpotPresenter.toResponse(item)));
  }

  private async handleGetById(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const parsed = spotIdParamSchema.safeParse(request.params);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'invalid_payload', details: parsed.error.format() });
    }

    const spot = await this.getParkingSpotById.execute({ parkingSpotId: parsed.data.id });
    return reply.status(200).send(parkingSpotPresenter.toResponse(spot));
  }

  private async handleUpdate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const params = spotIdParamSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: 'invalid_payload', details: params.error.format() });
    }

    const body = updateBodySchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'invalid_payload', details: body.error.format() });
    }

    const spot = await this.updateParkingSpotMetadata.execute({
      parkingSpotId: params.data.id,
      ...body.data,
    });
    return reply.status(200).send(parkingSpotPresenter.toResponse(spot));
  }

  private async handleDeactivate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const parsed = spotIdParamSchema.safeParse(request.params);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'invalid_payload', details: parsed.error.format() });
    }

    const spot = await this.deactivateParkingSpot.execute({ parkingSpotId: parsed.data.id });
    return reply.status(200).send(parkingSpotPresenter.toResponse(spot));
  }
}
