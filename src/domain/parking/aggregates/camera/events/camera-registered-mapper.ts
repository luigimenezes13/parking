import { type DomainEventMapper } from '@domain/shared/events/domain-event-mapper.ts';
import { type Camera } from '@domain/parking/aggregates/camera/camera.ts';
import { type CameraRegistered } from '@domain/parking/aggregates/camera/events/camera-registered.ts';

export interface CameraRegisteredContext {
  registeredAt: Date;
}

export const cameraRegisteredMapper: DomainEventMapper<
  Camera,
  CameraRegistered,
  CameraRegisteredContext
> = {
  toEvent(camera: Camera, context: CameraRegisteredContext): CameraRegistered {
    return Object.freeze({
      eventName: 'parking.camera.registered',
      occurredOn: new Date(),
      payload: Object.freeze({
        cameraId: camera.id().value(),
        parkingLotId: camera.parkingLotId().value(),
        name: camera.name().value(),
        streamUrl: camera.streamUrl().value(),
        registeredAt: new Date(context.registeredAt.getTime()),
      }),
    });
  },
};
