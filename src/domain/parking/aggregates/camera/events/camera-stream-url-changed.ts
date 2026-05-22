import { type DomainEvent } from '@domain/shared/events/domain-event.ts';

export interface CameraStreamUrlChangedPayload {
  cameraId: string;
  parkingLotId: string;
  previousStreamUrl: string;
  newStreamUrl: string;
  changedAt: Date;
}

export interface CameraStreamUrlChanged extends DomainEvent<CameraStreamUrlChangedPayload> {
  readonly eventName: 'parking.camera.stream-url-changed';
}
