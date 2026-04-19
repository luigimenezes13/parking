import { type DomainEvent } from '../../../../shared/events/domain-event.ts';

export interface VehicleExitedPayload {
  sessionId: string;
  licensePlate: string;
  spotCode: string;
  entryAt: Date;
  exitAt: Date;
}

export interface VehicleExited extends DomainEvent<VehicleExitedPayload> {
  readonly eventName: 'parking.session.vehicle-exited';
}
