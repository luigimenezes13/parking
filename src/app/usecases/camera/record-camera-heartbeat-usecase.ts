import { inject, injectable } from 'inversify';

import { type UseCase } from '@app/shared/use-case.ts';
import { TYPES } from '@app/dto/types.ts';
import { CameraNotFoundError } from '@app/exceptions/camera/camera-not-found-error.ts';
import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { type Camera } from '@domain/parking/aggregates/camera/camera.ts';
import { type CameraRepository } from '@domain/parking/repositories/camera-repository.ts';
import { type DomainEventPublisher } from '@domain/shared/events/domain-event-publisher.ts';

export interface RecordCameraHeartbeatInput {
  cameraId: string;
  observedAt?: Date;
}

@injectable()
export class RecordCameraHeartbeatUseCase implements UseCase<RecordCameraHeartbeatInput, Camera> {
  private readonly cameras: CameraRepository;
  private readonly publisher: DomainEventPublisher;

  constructor(
    @inject(TYPES.CameraRepository) cameras: CameraRepository,
    @inject(TYPES.DomainEventPublisher) publisher: DomainEventPublisher,
  ) {
    this.cameras = cameras;
    this.publisher = publisher;
  }

  async execute(input: RecordCameraHeartbeatInput): Promise<Camera> {
    const camera = await this.cameras.findById(UniqueIdentifier.fromExisting(input.cameraId));
    if (!camera || camera.isDeactivated()) {
      throw new CameraNotFoundError(input.cameraId);
    }

    camera.recordHeartbeat(input.observedAt ?? new Date());

    await this.cameras.save(camera);
    await this.publisher.publish(camera.pullDomainEvents());

    return camera;
  }
}
