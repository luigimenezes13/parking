import { type DomainEventMapper } from '../../../../shared/events/domain-event-mapper.ts';
import { type Vehicle } from '../vehicle.ts';
import { type VehicleRegistered } from './vehicle-registered.ts';

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
