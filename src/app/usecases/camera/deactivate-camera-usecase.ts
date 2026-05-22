import { inject, injectable } from 'inversify';

import { type UseCase } from '@app/shared/use-case.ts';
import { TYPES } from '@app/dto/types.ts';
import { CameraNotFoundError } from '@app/exceptions/camera/camera-not-found-error.ts';
import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { type Camera } from '@domain/parking/aggregates/camera/camera.ts';
import { type CameraRepository } from '@domain/parking/repositories/camera-repository.ts';

export interface DeactivateCameraInput {
  cameraId: string;
}

@injectable()
export class DeactivateCameraUseCase implements UseCase<DeactivateCameraInput, Camera> {
  private readonly cameras: CameraRepository;

  constructor(@inject(TYPES.CameraRepository) cameras: CameraRepository) {
    this.cameras = cameras;
  }

  async execute(input: DeactivateCameraInput): Promise<Camera> {
    const camera = await this.cameras.findById(UniqueIdentifier.fromExisting(input.cameraId));
    if (!camera) {
      throw new CameraNotFoundError(input.cameraId);
    }
    if (!camera.isDeactivated()) {
      camera.deactivate(new Date());
      await this.cameras.save(camera);
    }
    return camera;
  }
}
