import { inject, injectable } from 'inversify';

import { type UseCase } from '@app/shared/use-case.ts';
import { TYPES } from '@app/dto/types.ts';
import { type UpdateCameraRequest } from '@app/dto/inputs/camera/update-camera-input.ts';
import { CameraNotFoundError } from '@app/exceptions/camera/camera-not-found-error.ts';
import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { type Camera } from '@domain/parking/aggregates/camera/camera.ts';
import { CameraNameVO } from '@domain/parking/value-objects/camera-name-vo.ts';
import { StreamUrlVO } from '@domain/parking/value-objects/stream-url-vo.ts';
import { type CameraRepository } from '@domain/parking/repositories/camera-repository.ts';
import { type DomainEventPublisher } from '@domain/shared/events/domain-event-publisher.ts';

@injectable()
export class UpdateCameraUseCase implements UseCase<UpdateCameraRequest, Camera> {
  private readonly cameras: CameraRepository;
  private readonly publisher: DomainEventPublisher;

  constructor(
    @inject(TYPES.CameraRepository) cameras: CameraRepository,
    @inject(TYPES.DomainEventPublisher) publisher: DomainEventPublisher,
  ) {
    this.cameras = cameras;
    this.publisher = publisher;
  }

  async execute(input: UpdateCameraRequest): Promise<Camera> {
    const { cameraId, name, streamUrl } = input.props;

    const camera = await this.cameras.findById(UniqueIdentifier.fromExisting(cameraId));
    if (!camera || camera.isDeactivated()) {
      throw new CameraNotFoundError(cameraId);
    }

    if (typeof name === 'string') {
      camera.rename(CameraNameVO.from(name));
    }
    if (typeof streamUrl === 'string') {
      camera.updateStream(StreamUrlVO.from(streamUrl), new Date());
    }

    await this.cameras.save(camera);
    await this.publisher.publish(camera.pullDomainEvents());

    return camera;
  }
}
