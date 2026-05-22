import { type Camera } from '@domain/parking/aggregates/camera/camera.ts';

export interface CameraResponse {
  id: string;
  parkingLotId: string;
  name: string;
  streamUrl: string;
  status: string;
  lastSeenAt: string | null;
  deactivatedAt: string | null;
}

export const cameraPresenter = {
  toResponse(camera: Camera): CameraResponse {
    return {
      id: camera.id().value(),
      parkingLotId: camera.parkingLotId().value(),
      name: camera.name().value(),
      streamUrl: camera.streamUrl().value(),
      status: camera.status().serialize(),
      lastSeenAt: camera.lastSeenAt()?.toISOString() ?? null,
      deactivatedAt: camera.deactivatedAt()?.toISOString() ?? null,
    };
  },
};
