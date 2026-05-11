import { type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify';
import { inject, injectable } from 'inversify';
import { z } from 'zod/v4';

import { RegisterDriverUseCase } from '@app/usecases/driver/register-driver-usecase.ts';
import { GetDriverByIdUseCase } from '@app/usecases/driver/get-driver-by-id-usecase.ts';
import { ListDriversUseCase } from '@app/usecases/driver/list-drivers-usecase.ts';
import { UpdateDriverInfoUseCase } from '@app/usecases/driver/update-driver-info-usecase.ts';
import { DeactivateDriverUseCase } from '@app/usecases/driver/deactivate-driver-usecase.ts';
import { driverPresenter } from '@infra/controllers/driver-presenter.ts';

const registerBodySchema = z.object({
  cnh: z.string().min(1).max(11),
  name: z.string().min(1),
  email: z.email(),
  phone: z.string().min(1),
});

const updateBodySchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  phone: z.string().min(1),
});

const driverIdParamSchema = z.object({
  id: z.uuid(),
});

@injectable()
export class DriverController {
  private readonly registerDriver: RegisterDriverUseCase;
  private readonly getDriverById: GetDriverByIdUseCase;
  private readonly listDrivers: ListDriversUseCase;
  private readonly updateDriverInfo: UpdateDriverInfoUseCase;
  private readonly deactivateDriver: DeactivateDriverUseCase;

  constructor(
    @inject(RegisterDriverUseCase) registerDriver: RegisterDriverUseCase,
    @inject(GetDriverByIdUseCase) getDriverById: GetDriverByIdUseCase,
    @inject(ListDriversUseCase) listDrivers: ListDriversUseCase,
    @inject(UpdateDriverInfoUseCase) updateDriverInfo: UpdateDriverInfoUseCase,
    @inject(DeactivateDriverUseCase) deactivateDriver: DeactivateDriverUseCase,
  ) {
    this.registerDriver = registerDriver;
    this.getDriverById = getDriverById;
    this.listDrivers = listDrivers;
    this.updateDriverInfo = updateDriverInfo;
    this.deactivateDriver = deactivateDriver;
  }

  register(server: FastifyInstance): void {
    server.post('/drivers', this.handleRegister.bind(this));
    server.get('/drivers', this.handleList.bind(this));
    server.get('/drivers/:id', this.handleGetById.bind(this));
    server.patch('/drivers/:id', this.handleUpdate.bind(this));
    server.delete('/drivers/:id', this.handleDeactivate.bind(this));
  }

  private async handleRegister(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const parsed = registerBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'invalid_payload', details: parsed.error.format() });
    }

    const result = await this.registerDriver.execute(parsed.data);
    return reply.status(201).send({ id: result.driverId });
  }

  private async handleList(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const drivers = await this.listDrivers.execute({});
    return reply.status(200).send(drivers.map((driver) => driverPresenter.toResponse(driver)));
  }

  private async handleGetById(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const parsed = driverIdParamSchema.safeParse(request.params);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'invalid_payload', details: parsed.error.format() });
    }

    const driver = await this.getDriverById.execute({ driverId: parsed.data.id });
    return reply.status(200).send(driverPresenter.toResponse(driver));
  }

  private async handleUpdate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const params = driverIdParamSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: 'invalid_payload', details: params.error.format() });
    }

    const body = updateBodySchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'invalid_payload', details: body.error.format() });
    }

    const driver = await this.updateDriverInfo.execute({
      driverId: params.data.id,
      ...body.data,
    });
    return reply.status(200).send(driverPresenter.toResponse(driver));
  }

  private async handleDeactivate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const parsed = driverIdParamSchema.safeParse(request.params);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'invalid_payload', details: parsed.error.format() });
    }

    const driver = await this.deactivateDriver.execute({ driverId: parsed.data.id });
    return reply.status(200).send(driverPresenter.toResponse(driver));
  }
}
