import { type DomainEvent } from '@domain/shared/events/domain-event.ts';

export interface VehicleEnteredPayload {
  sessionId: string;
  vehicleId: string;
  licensePlate: string;
  spotId: string;
  spotCode: string;
  entryAt: Date;
}

export interface VehicleEntered extends DomainEvent<VehicleEnteredPayload> {
  readonly eventName: 'parking.session.vehicle-entered';
}
