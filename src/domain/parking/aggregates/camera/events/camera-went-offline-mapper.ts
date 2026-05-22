import { type DomainEventMapper } from '@domain/shared/events/domain-event-mapper.ts';
import { type Camera } from '@domain/parking/aggregates/camera/camera.ts';
import { type CameraWentOffline } from '@domain/parking/aggregates/camera/events/camera-went-offline.ts';

export interface CameraWentOfflineContext {
  lastSeenAt: Date | null;
  observedAt: Date;
}

export const cameraWentOfflineMapper: DomainEventMapper<
  Camera,
  CameraWentOffline,
  CameraWentOfflineContext
> = {
  toEvent(camera: Camera, context: CameraWentOfflineContext): CameraWentOffline {
    return Object.freeze({
      eventName: 'parking.camera.went-offline',
      occurredOn: new Date(),
      payload: Object.freeze({
        cameraId: camera.id().value(),
        parkingLotId: camera.parkingLotId().value(),
        lastSeenAt: context.lastSeenAt ? new Date(context.lastSeenAt.getTime()) : null,
        observedAt: new Date(context.observedAt.getTime()),
      }),
    });
  },
};
