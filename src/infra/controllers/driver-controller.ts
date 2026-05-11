import { type FastifyReply, type FastifyRequest } from 'fastify';
import { inject, injectable } from 'inversify';
import { z } from 'zod/v4';

import { RegisterDriverUseCase } from '@app/usecases/driver/register-driver-usecase.ts';
import { GetDriverByIdUseCase } from '@app/usecases/driver/get-driver-by-id-usecase.ts';
import { ListDriversUseCase } from '@app/usecases/driver/list-drivers-usecase.ts';
import { UpdateDriverInfoUseCase } from '@app/usecases/driver/update-driver-info-usecase.ts';
import { DeactivateDriverUseCase } from '@app/usecases/driver/deactivate-driver-usecase.ts';
import {
  RegisterDriverRequest,
  RegisterDriverRequestSchema,
  type RegisterDriverRequestDTO,
} from '@app/dto/inputs/driver/register-driver-input.ts';
import {
  UpdateDriverInfoRequest,
  UpdateDriverInfoRequestSchema,
  type UpdateDriverInfoRequestDTO,
} from '@app/dto/inputs/driver/update-driver-info-input.ts';
import { driverPresenter } from '@infra/controllers/driver-presenter.ts';
import { FastifyController } from '@infra/http/fastify-controller.ts';
import {
  ApiBodySchema,
  ApiOperation,
  ApiParamsSchema,
  ApiResponseSchema,
  ApiTag,
  Route,
} from '@infra/http/decorators/index.ts';

const driverIdParamSchema = z.object({
  id: z.uuid(),
});

const driverResponseSchema = z.object({
  id: z.uuid(),
  cnh: z.string(),
  name: z.string(),
  email: z.email(),
  phone: z.string(),
  deactivatedAt: z.string().nullable(),
});

const createdResponseSchema = z.object({ id: z.uuid() });

@injectable()
export class DriverController extends FastifyController {
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
    super();
    this.registerDriver = registerDriver;
    this.getDriverById = getDriverById;
    this.listDrivers = listDrivers;
    this.updateDriverInfo = updateDriverInfo;
    this.deactivateDriver = deactivateDriver;
  }

  @ApiTag('Drivers')
  @ApiOperation('Registrar motorista')
  @ApiBodySchema(RegisterDriverRequestSchema)
  @ApiResponseSchema({ 201: createdResponseSchema })
  @Route('post', '/drivers')
  async createDriver(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const dto = new RegisterDriverRequest(request.body as RegisterDriverRequestDTO);
    const { driverId } = await this.registerDriver.execute(dto);
    return reply.status(201).send({ id: driverId });
  }

  @ApiTag('Drivers')
  @ApiOperation('Listar motoristas')
  @ApiResponseSchema({ 200: z.array(driverResponseSchema) })
  @Route('get', '/drivers')
  async listDriversHandler(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const drivers = await this.listDrivers.execute({});
    return reply.status(200).send(drivers.map((driver) => driverPresenter.toResponse(driver)));
  }

  @ApiTag('Drivers')
  @ApiOperation('Buscar motorista por id')
  @ApiParamsSchema(driverIdParamSchema)
  @ApiResponseSchema({ 200: driverResponseSchema })
  @Route('get', '/drivers/:id')
  async getDriverByIdHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = request.params as { id: string };
    const driver = await this.getDriverById.execute({ driverId: id });
    return reply.status(200).send(driverPresenter.toResponse(driver));
  }

  @ApiTag('Drivers')
  @ApiOperation('Atualizar dados do motorista')
  @ApiParamsSchema(driverIdParamSchema)
  @ApiBodySchema(UpdateDriverInfoRequestSchema)
  @ApiResponseSchema({ 200: driverResponseSchema })
  @Route('patch', '/drivers/:id')
  async updateDriver(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = request.params as { id: string };
    const dto = new UpdateDriverInfoRequest({
      driverId: id,
      ...(request.body as Omit<UpdateDriverInfoRequestDTO, 'driverId'>),
    });
    const driver = await this.updateDriverInfo.execute(dto);
    return reply.status(200).send(driverPresenter.toResponse(driver));
  }

  @ApiTag('Drivers')
  @ApiOperation('Desativar motorista')
  @ApiParamsSchema(driverIdParamSchema)
  @ApiResponseSchema({ 200: driverResponseSchema })
  @Route('delete', '/drivers/:id')
  async deactivateDriverHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = request.params as { id: string };
    const driver = await this.deactivateDriver.execute({ driverId: id });
    return reply.status(200).send(driverPresenter.toResponse(driver));
  }
}
