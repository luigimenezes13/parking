import { type FastifyReply, type FastifyRequest } from 'fastify';
import { inject, injectable } from 'inversify';
import { z } from 'zod/v4';

import { CreateParkingSpotUseCase } from '@app/usecases/parking-spot/create-parking-spot-usecase.ts';
import { GetParkingSpotByIdUseCase } from '@app/usecases/parking-spot/get-parking-spot-by-id-usecase.ts';
import { ListParkingSpotsByLotUseCase } from '@app/usecases/parking-spot/list-parking-spots-by-lot-usecase.ts';
import { UpdateParkingSpotMetadataUseCase } from '@app/usecases/parking-spot/update-parking-spot-metadata-usecase.ts';
import { DeactivateParkingSpotUseCase } from '@app/usecases/parking-spot/deactivate-parking-spot-usecase.ts';
import {
  CreateParkingSpotRequest,
  CreateParkingSpotRequestSchema,
  type CreateParkingSpotRequestDTO,
} from '@app/dto/inputs/parking-spot/create-parking-spot-input.ts';
import {
  UpdateParkingSpotMetadataRequest,
  UpdateParkingSpotMetadataRequestSchema,
  type UpdateParkingSpotMetadataRequestDTO,
} from '@app/dto/inputs/parking-spot/update-parking-spot-metadata-input.ts';
import { parkingSpotPresenter } from '@infra/controllers/parking-spot-presenter.ts';
import { FastifyController } from '@infra/http/fastify-controller.ts';
import {
  ApiBodySchema,
  ApiOperation,
  ApiParamsSchema,
  ApiResponseSchema,
  ApiTag,
  Route,
} from '@infra/http/decorators/index.ts';

const spotIdParamSchema = z.object({ id: z.uuid() });
const lotIdParamSchema = z.object({ lotId: z.uuid() });

const parkingSpotResponseSchema = z.object({
  id: z.uuid(),
  parkingLotId: z.uuid(),
  code: z.string(),
  floor: z.number().int(),
  row: z.number().int(),
  column: z.number().int(),
  isCovered: z.boolean(),
  spotType: z.string(),
  status: z.string(),
  deactivatedAt: z.string().nullable(),
});

const createdResponseSchema = z.object({ id: z.uuid() });

@injectable()
export class ParkingSpotController extends FastifyController {
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
    super();
    this.createParkingSpot = createParkingSpot;
    this.getParkingSpotById = getParkingSpotById;
    this.listParkingSpotsByLot = listParkingSpotsByLot;
    this.updateParkingSpotMetadata = updateParkingSpotMetadata;
    this.deactivateParkingSpot = deactivateParkingSpot;
  }

  @ApiTag('ParkingSpots')
  @ApiOperation('Criar vaga')
  @ApiParamsSchema(lotIdParamSchema)
  @ApiBodySchema(CreateParkingSpotRequestSchema)
  @ApiResponseSchema({ 201: createdResponseSchema })
  @Route('post', '/parking-lots/:lotId/spots')
  async createParkingSpotHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { lotId } = request.params as { lotId: string };
    const dto = new CreateParkingSpotRequest({
      parkingLotId: lotId,
      ...(request.body as Omit<CreateParkingSpotRequestDTO, 'parkingLotId'>),
    });
    const { parkingSpotId } = await this.createParkingSpot.execute(dto);
    return reply.status(201).send({ id: parkingSpotId });
  }

  @ApiTag('ParkingSpots')
  @ApiOperation('Listar vagas do estacionamento')
  @ApiParamsSchema(lotIdParamSchema)
  @ApiResponseSchema({ 200: z.array(parkingSpotResponseSchema) })
  @Route('get', '/parking-lots/:lotId/spots')
  async listParkingSpotsByLotHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { lotId } = request.params as { lotId: string };
    const items = await this.listParkingSpotsByLot.execute({ parkingLotId: lotId });
    return reply.status(200).send(items.map((item) => parkingSpotPresenter.toResponse(item)));
  }

  @ApiTag('ParkingSpots')
  @ApiOperation('Buscar vaga por id')
  @ApiParamsSchema(spotIdParamSchema)
  @ApiResponseSchema({ 200: parkingSpotResponseSchema })
  @Route('get', '/parking-spots/:id')
  async getParkingSpotByIdHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = request.params as { id: string };
    const spot = await this.getParkingSpotById.execute({ parkingSpotId: id });
    return reply.status(200).send(parkingSpotPresenter.toResponse(spot));
  }

  @ApiTag('ParkingSpots')
  @ApiOperation('Atualizar metadados da vaga')
  @ApiParamsSchema(spotIdParamSchema)
  @ApiBodySchema(UpdateParkingSpotMetadataRequestSchema)
  @ApiResponseSchema({ 200: parkingSpotResponseSchema })
  @Route('patch', '/parking-spots/:id')
  async updateParkingSpotHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = request.params as { id: string };
    const dto = new UpdateParkingSpotMetadataRequest({
      parkingSpotId: id,
      ...(request.body as Omit<UpdateParkingSpotMetadataRequestDTO, 'parkingSpotId'>),
    });
    const spot = await this.updateParkingSpotMetadata.execute(dto);
    return reply.status(200).send(parkingSpotPresenter.toResponse(spot));
  }

  @ApiTag('ParkingSpots')
  @ApiOperation('Desativar vaga')
  @ApiParamsSchema(spotIdParamSchema)
  @ApiResponseSchema({ 200: parkingSpotResponseSchema })
  @Route('delete', '/parking-spots/:id')
  async deactivateParkingSpotHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = request.params as { id: string };
    const spot = await this.deactivateParkingSpot.execute({ parkingSpotId: id });
    return reply.status(200).send(parkingSpotPresenter.toResponse(spot));
  }
}
