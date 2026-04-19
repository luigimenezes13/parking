import { type DomainEventMapper } from '@domain/shared/events/domain-event-mapper.ts';
import { type Vehicle } from '@domain/parking/aggregates/vehicle/vehicle.ts';
import { type VehicleRegistered } from '@domain/parking/aggregates/vehicle/events/vehicle-registered.ts';

export const vehicleRegisteredMapper: DomainEventMapper<Vehicle, VehicleRegistered> = {
  toEvent(vehicle: Vehicle): VehicleRegistered {
    return Object.freeze({
      eventName: 'parking.vehicle.registered',
      occurredOn: new Date(),
      payload: Object.freeze({
        vehicleId: vehicle.id().value(),
        licensePlate: vehicle.licensePlate().value(),
        model: vehicle.model(),
        brand: vehicle.brand(),
        color: vehicle.color(),
      }),
    });
  },
};
