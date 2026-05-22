import { type DomainEvent } from '@domain/shared/events/domain-event.ts';

export interface CameraWentOfflinePayload {
  cameraId: string;
  parkingLotId: string;
  lastSeenAt: Date | null;
  observedAt: Date;
}

export interface CameraWentOffline extends DomainEvent<CameraWentOfflinePayload> {
  readonly eventName: 'parking.camera.went-offline';
}
