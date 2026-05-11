import { type FastifyReply, type FastifyRequest } from 'fastify';
import { inject, injectable } from 'inversify';
import { z } from 'zod/v4';

import { RegisterVehicleUseCase } from '@app/usecases/vehicle/register-vehicle-usecase.ts';
import { GetVehicleByIdUseCase } from '@app/usecases/vehicle/get-vehicle-by-id-usecase.ts';
import { ListVehiclesByDriverUseCase } from '@app/usecases/vehicle/list-vehicles-by-driver-usecase.ts';
import { ListVehiclesByLotUseCase } from '@app/usecases/vehicle/list-vehicles-by-lot-usecase.ts';
import { UpdateVehicleAppearanceUseCase } from '@app/usecases/vehicle/update-vehicle-appearance-usecase.ts';
import { TransferVehicleOwnershipUseCase } from '@app/usecases/vehicle/transfer-vehicle-ownership-usecase.ts';
import { DeactivateVehicleUseCase } from '@app/usecases/vehicle/deactivate-vehicle-usecase.ts';
import {
  RegisterVehicleRequest,
  RegisterVehicleRequestSchema,
  type RegisterVehicleRequestDTO,
} from '@app/dto/inputs/vehicle/register-vehicle-input.ts';
import {
  UpdateVehicleAppearanceRequest,
  UpdateVehicleAppearanceRequestSchema,
  type UpdateVehicleAppearanceRequestDTO,
} from '@app/dto/inputs/vehicle/update-vehicle-appearance-input.ts';
import {
  TransferVehicleOwnershipRequest,
  TransferVehicleOwnershipRequestSchema,
  type TransferVehicleOwnershipRequestDTO,
} from '@app/dto/inputs/vehicle/transfer-vehicle-ownership-input.ts';
import { vehiclePresenter } from '@infra/controllers/vehicle-presenter.ts';
import { FastifyController } from '@infra/http/fastify-controller.ts';
import {
  ApiBodySchema,
  ApiOperation,
  ApiParamsSchema,
  ApiResponseSchema,
  ApiTag,
  Route,
} from '@infra/http/decorators/index.ts';

const vehicleIdParamSchema = z.object({ id: z.uuid() });
const driverIdParamSchema = z.object({ driverId: z.uuid() });
const lotIdParamSchema = z.object({ lotId: z.uuid() });

const vehicleResponseSchema = z.object({
  id: z.uuid(),
  driverId: z.uuid().nullable(),
  parkingLotId: z.uuid(),
  licensePlate: z.string(),
  brand: z.string().nullable(),
  model: z.string().nullable(),
  color: z.string().nullable(),
  deactivatedAt: z.string().nullable(),
});

const createdResponseSchema = z.object({ id: z.uuid() });

@injectable()
export class VehicleController extends FastifyController {
  private readonly registerVehicle: RegisterVehicleUseCase;
  private readonly getVehicleById: GetVehicleByIdUseCase;
  private readonly listVehiclesByDriver: ListVehiclesByDriverUseCase;
  private readonly listVehiclesByLot: ListVehiclesByLotUseCase;
  private readonly updateVehicleAppearance: UpdateVehicleAppearanceUseCase;
  private readonly transferVehicleOwnership: TransferVehicleOwnershipUseCase;
  private readonly deactivateVehicle: DeactivateVehicleUseCase;

  constructor(
    @inject(RegisterVehicleUseCase) registerVehicle: RegisterVehicleUseCase,
    @inject(GetVehicleByIdUseCase) getVehicleById: GetVehicleByIdUseCase,
    @inject(ListVehiclesByDriverUseCase) listVehiclesByDriver: ListVehiclesByDriverUseCase,
    @inject(ListVehiclesByLotUseCase) listVehiclesByLot: ListVehiclesByLotUseCase,
    @inject(UpdateVehicleAppearanceUseCase) updateVehicleAppearance: UpdateVehicleAppearanceUseCase,
    @inject(TransferVehicleOwnershipUseCase)
    transferVehicleOwnership: TransferVehicleOwnershipUseCase,
    @inject(DeactivateVehicleUseCase) deactivateVehicle: DeactivateVehicleUseCase,
  ) {
    super();
    this.registerVehicle = registerVehicle;
    this.getVehicleById = getVehicleById;
    this.listVehiclesByDriver = listVehiclesByDriver;
    this.listVehiclesByLot = listVehiclesByLot;
    this.updateVehicleAppearance = updateVehicleAppearance;
    this.transferVehicleOwnership = transferVehicleOwnership;
    this.deactivateVehicle = deactivateVehicle;
  }

  @ApiTag('Vehicles')
  @ApiOperation('Registrar veiculo')
  @ApiBodySchema(RegisterVehicleRequestSchema)
  @ApiResponseSchema({ 201: createdResponseSchema })
  @Route('post', '/vehicles')
  async registerVehicleHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const dto = new RegisterVehicleRequest(request.body as RegisterVehicleRequestDTO);
    const { vehicleId } = await this.registerVehicle.execute(dto);
    return reply.status(201).send({ id: vehicleId });
  }

  @ApiTag('Vehicles')
  @ApiOperation('Buscar veiculo por id')
  @ApiParamsSchema(vehicleIdParamSchema)
  @ApiResponseSchema({ 200: vehicleResponseSchema })
  @Route('get', '/vehicles/:id')
  async getVehicleByIdHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = request.params as { id: string };
    const vehicle = await this.getVehicleById.execute({ vehicleId: id });
    return reply.status(200).send(vehiclePresenter.toResponse(vehicle));
  }

  @ApiTag('Vehicles')
  @ApiOperation('Listar veiculos por motorista')
  @ApiParamsSchema(driverIdParamSchema)
  @ApiResponseSchema({ 200: z.array(vehicleResponseSchema) })
  @Route('get', '/drivers/:driverId/vehicles')
  async listVehiclesByDriverHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { driverId } = request.params as { driverId: string };
    const items = await this.listVehiclesByDriver.execute({ driverId });
    return reply.status(200).send(items.map((item) => vehiclePresenter.toResponse(item)));
  }

  @ApiTag('Vehicles')
  @ApiOperation('Listar veiculos por estacionamento')
  @ApiParamsSchema(lotIdParamSchema)
  @ApiResponseSchema({ 200: z.array(vehicleResponseSchema) })
  @Route('get', '/parking-lots/:lotId/vehicles')
  async listVehiclesByLotHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { lotId } = request.params as { lotId: string };
    const items = await this.listVehiclesByLot.execute({ parkingLotId: lotId });
    return reply.status(200).send(items.map((item) => vehiclePresenter.toResponse(item)));
  }

  @ApiTag('Vehicles')
  @ApiOperation('Atualizar aparencia do veiculo')
  @ApiParamsSchema(vehicleIdParamSchema)
  @ApiBodySchema(UpdateVehicleAppearanceRequestSchema)
  @ApiResponseSchema({ 200: vehicleResponseSchema })
  @Route('patch', '/vehicles/:id/appearance')
  async updateVehicleAppearanceHandler(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const { id } = request.params as { id: string };
    const dto = new UpdateVehicleAppearanceRequest({
      vehicleId: id,
      ...(request.body as Omit<UpdateVehicleAppearanceRequestDTO, 'vehicleId'>),
    });
    const vehicle = await this.updateVehicleAppearance.execute(dto);
    return reply.status(200).send(vehiclePresenter.toResponse(vehicle));
  }

  @ApiTag('Vehicles')
  @ApiOperation('Transferir propriedade do veiculo')
  @ApiParamsSchema(vehicleIdParamSchema)
  @ApiBodySchema(TransferVehicleOwnershipRequestSchema)
  @ApiResponseSchema({ 200: vehicleResponseSchema })
  @Route('patch', '/vehicles/:id/owner')
  async transferVehicleOwnershipHandler(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const { id } = request.params as { id: string };
    const dto = new TransferVehicleOwnershipRequest({
      vehicleId: id,
      ...(request.body as Omit<TransferVehicleOwnershipRequestDTO, 'vehicleId'>),
    });
    const vehicle = await this.transferVehicleOwnership.execute(dto);
    return reply.status(200).send(vehiclePresenter.toResponse(vehicle));
  }

  @ApiTag('Vehicles')
  @ApiOperation('Desativar veiculo')
  @ApiParamsSchema(vehicleIdParamSchema)
  @ApiResponseSchema({ 200: vehicleResponseSchema })
  @Route('delete', '/vehicles/:id')
  async deactivateVehicleHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = request.params as { id: string };
    const vehicle = await this.deactivateVehicle.execute({ vehicleId: id });
    return reply.status(200).send(vehiclePresenter.toResponse(vehicle));
  }
}
