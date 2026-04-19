import { type DomainEvent } from '@domain/shared/events/domain-event.ts';

export interface VehicleRegisteredPayload {
  vehicleId: string;
  licensePlate: string;
  model: string;
  brand: string;
  color: string;
}

export interface VehicleRegistered extends DomainEvent<VehicleRegisteredPayload> {
  readonly eventName: 'parking.vehicle.registered';
}
