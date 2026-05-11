import { type FastifyReply, type FastifyRequest } from 'fastify';
import { inject, injectable } from 'inversify';
import { z } from 'zod/v4';

import { CreateParkingLotUseCase } from '@app/usecases/parking-lot/create-parking-lot-usecase.ts';
import { GetParkingLotByIdUseCase } from '@app/usecases/parking-lot/get-parking-lot-by-id-usecase.ts';
import { ListParkingLotsUseCase } from '@app/usecases/parking-lot/list-parking-lots-usecase.ts';
import { UpdateParkingLotInfoUseCase } from '@app/usecases/parking-lot/update-parking-lot-info-usecase.ts';
import { DeactivateParkingLotUseCase } from '@app/usecases/parking-lot/deactivate-parking-lot-usecase.ts';
import { GetParkingLotMapUseCase } from '@app/usecases/parking-lot/get-parking-lot-map-usecase.ts';
import {
  CreateParkingLotRequest,
  CreateParkingLotRequestSchema,
  type CreateParkingLotRequestDTO,
} from '@app/dto/inputs/parking-lot/create-parking-lot-input.ts';
import {
  UpdateParkingLotInfoRequest,
  UpdateParkingLotInfoRequestSchema,
  type UpdateParkingLotInfoRequestDTO,
} from '@app/dto/inputs/parking-lot/update-parking-lot-info-input.ts';
import { parkingLotPresenter } from '@infra/controllers/parking-lot-presenter.ts';
import { parkingLotMapPresenter } from '@infra/controllers/parking-lot-map-presenter.ts';
import { FastifyController } from '@infra/http/fastify-controller.ts';
import {
  ApiBodySchema,
  ApiOperation,
  ApiParamsSchema,
  ApiResponseSchema,
  ApiTag,
  Route,
} from '@infra/http/decorators/index.ts';

const parkingLotIdParamSchema = z.object({
  id: z.uuid(),
});

const parkingLotResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  address: z.string(),
  totalCapacity: z.number().int().positive(),
  deactivatedAt: z.string().nullable(),
});

const createdResponseSchema = z.object({ id: z.uuid() });

@injectable()
export class ParkingLotController extends FastifyController {
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
    super();
    this.createParkingLot = createParkingLot;
    this.getParkingLotById = getParkingLotById;
    this.listParkingLots = listParkingLots;
    this.updateParkingLotInfo = updateParkingLotInfo;
    this.deactivateParkingLot = deactivateParkingLot;
    this.getParkingLotMap = getParkingLotMap;
  }

  @ApiTag('ParkingLots')
  @ApiOperation('Criar estacionamento')
  @ApiBodySchema(CreateParkingLotRequestSchema)
  @ApiResponseSchema({ 201: createdResponseSchema })
  @Route('post', '/parking-lots')
  async createParkingLotHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const dto = new CreateParkingLotRequest(request.body as CreateParkingLotRequestDTO);
    const { parkingLotId } = await this.createParkingLot.execute(dto);
    return reply.status(201).send({ id: parkingLotId });
  }

  @ApiTag('ParkingLots')
  @ApiOperation('Listar estacionamentos')
  @ApiResponseSchema({ 200: z.array(parkingLotResponseSchema) })
  @Route('get', '/parking-lots')
  async listParkingLotsHandler(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const lots = await this.listParkingLots.execute({});
    return reply.status(200).send(lots.map((lot) => parkingLotPresenter.toResponse(lot)));
  }

  @ApiTag('ParkingLots')
  @ApiOperation('Buscar estacionamento por id')
  @ApiParamsSchema(parkingLotIdParamSchema)
  @ApiResponseSchema({ 200: parkingLotResponseSchema })
  @Route('get', '/parking-lots/:id')
  async getParkingLotByIdHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = request.params as { id: string };
    const lot = await this.getParkingLotById.execute({ parkingLotId: id });
    return reply.status(200).send(parkingLotPresenter.toResponse(lot));
  }

  @ApiTag('ParkingLots')
  @ApiOperation('Mapa de ocupacao do estacionamento')
  @ApiParamsSchema(parkingLotIdParamSchema)
  @Route('get', '/parking-lots/:id/map')
  async getParkingLotMapHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = request.params as { id: string };
    const view = await this.getParkingLotMap.execute({ parkingLotId: id });
    return reply.status(200).send(parkingLotMapPresenter.toResponse(view));
  }

  @ApiTag('ParkingLots')
  @ApiOperation('Atualizar dados do estacionamento')
  @ApiParamsSchema(parkingLotIdParamSchema)
  @ApiBodySchema(UpdateParkingLotInfoRequestSchema)
  @ApiResponseSchema({ 200: parkingLotResponseSchema })
  @Route('patch', '/parking-lots/:id')
  async updateParkingLotHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = request.params as { id: string };
    const dto = new UpdateParkingLotInfoRequest({
      parkingLotId: id,
      ...(request.body as Omit<UpdateParkingLotInfoRequestDTO, 'parkingLotId'>),
    });
    const lot = await this.updateParkingLotInfo.execute(dto);
    return reply.status(200).send(parkingLotPresenter.toResponse(lot));
  }

  @ApiTag('ParkingLots')
  @ApiOperation('Desativar estacionamento')
  @ApiParamsSchema(parkingLotIdParamSchema)
  @ApiResponseSchema({ 200: parkingLotResponseSchema })
  @Route('delete', '/parking-lots/:id')
  async deactivateParkingLotHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = request.params as { id: string };
    const lot = await this.deactivateParkingLot.execute({ parkingLotId: id });
    return reply.status(200).send(parkingLotPresenter.toResponse(lot));
  }
}
