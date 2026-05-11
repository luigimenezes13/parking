import { type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify';
import { inject, injectable } from 'inversify';
import { z } from 'zod/v4';

import { RegisterVehicleUseCase } from '@app/usecases/vehicle/register-vehicle-usecase.ts';
import { GetVehicleByIdUseCase } from '@app/usecases/vehicle/get-vehicle-by-id-usecase.ts';
import { ListVehiclesByDriverUseCase } from '@app/usecases/vehicle/list-vehicles-by-driver-usecase.ts';
import { ListVehiclesByLotUseCase } from '@app/usecases/vehicle/list-vehicles-by-lot-usecase.ts';
import { UpdateVehicleAppearanceUseCase } from '@app/usecases/vehicle/update-vehicle-appearance-usecase.ts';
import { TransferVehicleOwnershipUseCase } from '@app/usecases/vehicle/transfer-vehicle-ownership-usecase.ts';
import { DeactivateVehicleUseCase } from '@app/usecases/vehicle/deactivate-vehicle-usecase.ts';
import { vehiclePresenter } from '@infra/controllers/vehicle-presenter.ts';

const registerBodySchema = z.object({
  driverId: z.uuid().optional().nullable(),
  parkingLotId: z.uuid(),
  licensePlate: z.string().min(7).max(8),
  brand: z.string().min(1).nullable().optional(),
  model: z.string().min(1).nullable().optional(),
  color: z.string().min(1).nullable().optional(),
});

const appearanceBodySchema = z.object({
  brand: z.string().min(1).nullable(),
  model: z.string().min(1).nullable(),
  color: z.string().min(1).nullable(),
});

const transferOwnerBodySchema = z.object({
  driverId: z.uuid(),
});

const vehicleIdParamSchema = z.object({
  id: z.uuid(),
});

const driverIdParamSchema = z.object({
  driverId: z.uuid(),
});

const lotIdParamSchema = z.object({
  lotId: z.uuid(),
});

@injectable()
export class VehicleController {
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
    this.registerVehicle = registerVehicle;
    this.getVehicleById = getVehicleById;
    this.listVehiclesByDriver = listVehiclesByDriver;
    this.listVehiclesByLot = listVehiclesByLot;
    this.updateVehicleAppearance = updateVehicleAppearance;
    this.transferVehicleOwnership = transferVehicleOwnership;
    this.deactivateVehicle = deactivateVehicle;
  }

  register(server: FastifyInstance): void {
    server.post('/vehicles', this.handleRegister.bind(this));
    server.get('/vehicles/:id', this.handleGetById.bind(this));
    server.get('/drivers/:driverId/vehicles', this.handleListByDriver.bind(this));
    server.get('/parking-lots/:lotId/vehicles', this.handleListByLot.bind(this));
    server.patch('/vehicles/:id/appearance', this.handleUpdateAppearance.bind(this));
    server.patch('/vehicles/:id/owner', this.handleTransferOwnership.bind(this));
    server.delete('/vehicles/:id', this.handleDeactivate.bind(this));
  }

  private async handleRegister(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const parsed = registerBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'invalid_payload', details: parsed.error.format() });
    }

    const result = await this.registerVehicle.execute(parsed.data);
    return reply.status(201).send({ id: result.vehicleId });
  }

  private async handleGetById(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const parsed = vehicleIdParamSchema.safeParse(request.params);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'invalid_payload', details: parsed.error.format() });
    }

    const vehicle = await this.getVehicleById.execute({ vehicleId: parsed.data.id });
    return reply.status(200).send(vehiclePresenter.toResponse(vehicle));
  }

  private async handleListByDriver(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const parsed = driverIdParamSchema.safeParse(request.params);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'invalid_payload', details: parsed.error.format() });
    }

    const items = await this.listVehiclesByDriver.execute({ driverId: parsed.data.driverId });
    return reply.status(200).send(items.map((item) => vehiclePresenter.toResponse(item)));
  }

  private async handleListByLot(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const parsed = lotIdParamSchema.safeParse(request.params);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'invalid_payload', details: parsed.error.format() });
    }

    const items = await this.listVehiclesByLot.execute({ parkingLotId: parsed.data.lotId });
    return reply.status(200).send(items.map((item) => vehiclePresenter.toResponse(item)));
  }

  private async handleUpdateAppearance(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const params = vehicleIdParamSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: 'invalid_payload', details: params.error.format() });
    }

    const body = appearanceBodySchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'invalid_payload', details: body.error.format() });
    }

    const vehicle = await this.updateVehicleAppearance.execute({
      vehicleId: params.data.id,
      ...body.data,
    });
    return reply.status(200).send(vehiclePresenter.toResponse(vehicle));
  }

  private async handleTransferOwnership(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const params = vehicleIdParamSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: 'invalid_payload', details: params.error.format() });
    }

    const body = transferOwnerBodySchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'invalid_payload', details: body.error.format() });
    }

    const vehicle = await this.transferVehicleOwnership.execute({
      vehicleId: params.data.id,
      newDriverId: body.data.driverId,
    });
    return reply.status(200).send(vehiclePresenter.toResponse(vehicle));
  }

  private async handleDeactivate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const parsed = vehicleIdParamSchema.safeParse(request.params);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'invalid_payload', details: parsed.error.format() });
    }

    const vehicle = await this.deactivateVehicle.execute({ vehicleId: parsed.data.id });
    return reply.status(200).send(vehiclePresenter.toResponse(vehicle));
  }
}
