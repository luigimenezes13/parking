import { type DomainEvent } from '@domain/shared/events/domain-event.ts';

export interface CameraWentOnlinePayload {
  cameraId: string;
  parkingLotId: string;
  observedAt: Date;
}

export interface CameraWentOnline extends DomainEvent<CameraWentOnlinePayload> {
  readonly eventName: 'parking.camera.went-online';
}
