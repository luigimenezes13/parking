import { type DomainEventMapper } from '@domain/shared/events/domain-event-mapper.ts';
import { type Camera } from '@domain/parking/aggregates/camera/camera.ts';
import { type CameraWentOnline } from '@domain/parking/aggregates/camera/events/camera-went-online.ts';

export interface CameraWentOnlineContext {
  observedAt: Date;
}

export const cameraWentOnlineMapper: DomainEventMapper<
  Camera,
  CameraWentOnline,
  CameraWentOnlineContext
> = {
  toEvent(camera: Camera, context: CameraWentOnlineContext): CameraWentOnline {
    return Object.freeze({
      eventName: 'parking.camera.went-online',
      occurredOn: new Date(),
      payload: Object.freeze({
        cameraId: camera.id().value(),
        parkingLotId: camera.parkingLotId().value(),
        observedAt: new Date(context.observedAt.getTime()),
      }),
    });
  },
};
