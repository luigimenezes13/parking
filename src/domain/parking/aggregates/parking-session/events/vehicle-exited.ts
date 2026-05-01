import { type DomainEvent } from '@domain/shared/events/domain-event.ts';

export interface VehicleExitedPayload {
  sessionId: string;
  licensePlate: string;
  exitAt: Date;
}

export interface VehicleExited extends DomainEvent<VehicleExitedPayload> {
  readonly eventName: 'parking.session.vehicle-exited';
}
