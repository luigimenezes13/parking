import { inject, injectable } from 'inversify';

import { type UseCase } from '@app/shared/use-case.ts';
import { TYPES } from '@app/dto/types.ts';
import { CameraNotFoundError } from '@app/exceptions/camera/camera-not-found-error.ts';
import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { type Camera } from '@domain/parking/aggregates/camera/camera.ts';
import { type CameraRepository } from '@domain/parking/repositories/camera-repository.ts';

export interface GetCameraByIdInput {
  cameraId: string;
}

@injectable()
export class GetCameraByIdUseCase implements UseCase<GetCameraByIdInput, Camera> {
  private readonly cameras: CameraRepository;

  constructor(@inject(TYPES.CameraRepository) cameras: CameraRepository) {
    this.cameras = cameras;
  }

  async execute(input: GetCameraByIdInput): Promise<Camera> {
    const camera = await this.cameras.findById(UniqueIdentifier.fromExisting(input.cameraId));
    if (!camera || camera.isDeactivated()) {
      throw new CameraNotFoundError(input.cameraId);
    }
    return camera;
  }
}
