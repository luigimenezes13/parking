import { type DomainEvent } from '@domain/shared/events/domain-event.ts';

export interface VehicleEnteredPayload {
  sessionId: string;
  parkingLotId: string;
  vehicleId: string | null;
  licensePlate: string | null;
  entryAt: Date;
}

export interface VehicleEntered extends DomainEvent<VehicleEnteredPayload> {
  readonly eventName: 'parking.session.vehicle-entered';
}
