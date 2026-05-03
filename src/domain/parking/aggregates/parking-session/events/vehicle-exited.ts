import { type DomainEvent } from '@domain/shared/events/domain-event.ts';

export interface VehicleExitedPayload {
  sessionId: string;
  parkingLotId: string;
  vehicleId: string | null;
  licensePlate: string | null;
  exitAt: Date;
}

export interface VehicleExited extends DomainEvent<VehicleExitedPayload> {
  readonly eventName: 'parking.session.vehicle-exited';
}
