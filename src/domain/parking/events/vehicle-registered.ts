import { type DomainEvent } from '@domain/shared/events/domain-event.ts';

export interface VehicleRegisteredPayload {
  vehicleId: string;
  parkingLotId: string;
  licensePlate: string;
  hasDriver: boolean;
}

export interface VehicleRegistered extends DomainEvent<VehicleRegisteredPayload> {
  readonly eventName: 'parking.vehicle.registered';
}

export function createVehicleRegistered(payload: VehicleRegisteredPayload): VehicleRegistered {
  return Object.freeze({
    eventName: 'parking.vehicle.registered',
    occurredOn: new Date(),
    payload: Object.freeze({
      vehicleId: payload.vehicleId,
      parkingLotId: payload.parkingLotId,
      licensePlate: payload.licensePlate,
      hasDriver: payload.hasDriver,
    }),
  });
}
