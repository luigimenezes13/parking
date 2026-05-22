import { type FastifyReply, type FastifyRequest } from 'fastify';
import { inject, injectable } from 'inversify';
import { z } from 'zod/v4';

import { RegisterCameraUseCase } from '@app/usecases/camera/register-camera-usecase.ts';
import { GetCameraByIdUseCase } from '@app/usecases/camera/get-camera-by-id-usecase.ts';
import { ListCamerasByLotUseCase } from '@app/usecases/camera/list-cameras-by-lot-usecase.ts';
import { UpdateCameraUseCase } from '@app/usecases/camera/update-camera-usecase.ts';
import { RecordCameraHeartbeatUseCase } from '@app/usecases/camera/record-camera-heartbeat-usecase.ts';
import { DeactivateCameraUseCase } from '@app/usecases/camera/deactivate-camera-usecase.ts';
import {
  RegisterCameraRequest,
  RegisterCameraRequestSchema,
  type RegisterCameraRequestDTO,
} from '@app/dto/inputs/camera/register-camera-input.ts';
import {
  UpdateCameraRequest,
  UpdateCameraRequestSchema,
  type UpdateCameraRequestDTO,
} from '@app/dto/inputs/camera/update-camera-input.ts';
import { cameraPresenter } from '@infra/controllers/camera-presenter.ts';
import { FastifyController } from '@infra/http/fastify-controller.ts';
import {
  ApiBodySchema,
  ApiOperation,
  ApiParamsSchema,
  ApiResponseSchema,
  ApiTag,
  Route,
} from '@infra/http/decorators/index.ts';

const cameraIdParamSchema = z.object({ id: z.uuid() });
const lotIdParamSchema = z.object({ lotId: z.uuid() });

const cameraResponseSchema = z.object({
  id: z.uuid(),
  parkingLotId: z.uuid(),
  name: z.string(),
  streamUrl: z.string(),
  status: z.string(),
  lastSeenAt: z.string().nullable(),
  deactivatedAt: z.string().nullable(),
});

const createdResponseSchema = z.object({ id: z.uuid() });

@injectable()
export class CameraController extends FastifyController {
  private readonly registerCamera: RegisterCameraUseCase;
  private readonly getCameraById: GetCameraByIdUseCase;
  private readonly listCamerasByLot: ListCamerasByLotUseCase;
  private readonly updateCamera: UpdateCameraUseCase;
  private readonly recordCameraHeartbeat: RecordCameraHeartbeatUseCase;
  private readonly deactivateCamera: DeactivateCameraUseCase;

  constructor(
    @inject(RegisterCameraUseCase) registerCamera: RegisterCameraUseCase,
    @inject(GetCameraByIdUseCase) getCameraById: GetCameraByIdUseCase,
    @inject(ListCamerasByLotUseCase) listCamerasByLot: ListCamerasByLotUseCase,
    @inject(UpdateCameraUseCase) updateCamera: UpdateCameraUseCase,
    @inject(RecordCameraHeartbeatUseCase) recordCameraHeartbeat: RecordCameraHeartbeatUseCase,
    @inject(DeactivateCameraUseCase) deactivateCamera: DeactivateCameraUseCase,
  ) {
    super();
    this.registerCamera = registerCamera;
    this.getCameraById = getCameraById;
    this.listCamerasByLot = listCamerasByLot;
    this.updateCamera = updateCamera;
    this.recordCameraHeartbeat = recordCameraHeartbeat;
    this.deactivateCamera = deactivateCamera;
  }

  @ApiTag('Cameras')
  @ApiOperation('Registrar câmera')
  @ApiParamsSchema(lotIdParamSchema)
  @ApiBodySchema(RegisterCameraRequestSchema)
  @ApiResponseSchema({ 201: createdResponseSchema })
  @Route('post', '/parking-lots/:lotId/cameras')
  async registerCameraHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { lotId } = request.params as { lotId: string };
    const dto = new RegisterCameraRequest({
      parkingLotId: lotId,
      ...(request.body as Omit<RegisterCameraRequestDTO, 'parkingLotId'>),
    });
    const { cameraId } = await this.registerCamera.execute(dto);
    return reply.status(201).send({ id: cameraId });
  }

  @ApiTag('Cameras')
  @ApiOperation('Listar câmeras do estacionamento')
  @ApiParamsSchema(lotIdParamSchema)
  @ApiResponseSchema({ 200: z.array(cameraResponseSchema) })
  @Route('get', '/parking-lots/:lotId/cameras')
  async listCamerasHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { lotId } = request.params as { lotId: string };
    const items = await this.listCamerasByLot.execute({ parkingLotId: lotId });
    return reply.status(200).send(items.map((camera) => cameraPresenter.toResponse(camera)));
  }

  @ApiTag('Cameras')
  @ApiOperation('Buscar câmera por id')
  @ApiParamsSchema(cameraIdParamSchema)
  @ApiResponseSchema({ 200: cameraResponseSchema })
  @Route('get', '/cameras/:id')
  async getCameraHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = request.params as { id: string };
    const camera = await this.getCameraById.execute({ cameraId: id });
    return reply.status(200).send(cameraPresenter.toResponse(camera));
  }

  @ApiTag('Cameras')
  @ApiOperation('Atualizar dados da câmera')
  @ApiParamsSchema(cameraIdParamSchema)
  @ApiBodySchema(UpdateCameraRequestSchema)
  @ApiResponseSchema({ 200: cameraResponseSchema })
  @Route('patch', '/cameras/:id')
  async updateCameraHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = request.params as { id: string };
    const dto = new UpdateCameraRequest({
      cameraId: id,
      ...(request.body as Omit<UpdateCameraRequestDTO, 'cameraId'>),
    });
    const camera = await this.updateCamera.execute(dto);
    return reply.status(200).send(cameraPresenter.toResponse(camera));
  }

  @ApiTag('Cameras')
  @ApiOperation('Registrar heartbeat de câmera (chamado pela Pi)')
  @ApiParamsSchema(cameraIdParamSchema)
  @ApiResponseSchema({ 200: cameraResponseSchema })
  @Route('post', '/cameras/:id/heartbeat')
  async heartbeatHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = request.params as { id: string };
    const camera = await this.recordCameraHeartbeat.execute({ cameraId: id });
    return reply.status(200).send(cameraPresenter.toResponse(camera));
  }

  @ApiTag('Cameras')
  @ApiOperation('Desativar câmera')
  @ApiParamsSchema(cameraIdParamSchema)
  @ApiResponseSchema({ 200: cameraResponseSchema })
  @Route('delete', '/cameras/:id')
  async deactivateCameraHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = request.params as { id: string };
    const camera = await this.deactivateCamera.execute({ cameraId: id });
    return reply.status(200).send(cameraPresenter.toResponse(camera));
  }
}
