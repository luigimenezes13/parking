import { type DomainEvent } from '@domain/shared/events/domain-event.ts';

export interface CameraRegisteredPayload {
  cameraId: string;
  parkingLotId: string;
  name: string;
  streamUrl: string;
  registeredAt: Date;
}

export interface CameraRegistered extends DomainEvent<CameraRegisteredPayload> {
  readonly eventName: 'parking.camera.registered';
}
