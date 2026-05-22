import { type DomainEventMapper } from '@domain/shared/events/domain-event-mapper.ts';
import { type Camera } from '@domain/parking/aggregates/camera/camera.ts';
import { type CameraStreamUrlChanged } from '@domain/parking/aggregates/camera/events/camera-stream-url-changed.ts';

export interface CameraStreamUrlChangedContext {
  previousStreamUrl: string;
  changedAt: Date;
}

export const cameraStreamUrlChangedMapper: DomainEventMapper<
  Camera,
  CameraStreamUrlChanged,
  CameraStreamUrlChangedContext
> = {
  toEvent(camera: Camera, context: CameraStreamUrlChangedContext): CameraStreamUrlChanged {
    return Object.freeze({
      eventName: 'parking.camera.stream-url-changed',
      occurredOn: new Date(),
      payload: Object.freeze({
        cameraId: camera.id().value(),
        parkingLotId: camera.parkingLotId().value(),
        previousStreamUrl: context.previousStreamUrl,
        newStreamUrl: camera.streamUrl().value(),
        changedAt: new Date(context.changedAt.getTime()),
      }),
    });
  },
};
