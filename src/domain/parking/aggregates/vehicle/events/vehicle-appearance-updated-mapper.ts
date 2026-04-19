import { type DomainEventMapper } from '../../../../shared/events/domain-event-mapper.ts';
import { type Vehicle } from '../vehicle.ts';
import { type VehicleAppearanceUpdated } from './vehicle-appearance-updated.ts';

export const vehicleAppearanceUpdatedMapper: DomainEventMapper<Vehicle, VehicleAppearanceUpdated> = {
  toEvent(vehicle: Vehicle): VehicleAppearanceUpdated {
    return Object.freeze({
      eventName: 'parking.vehicle.appearance-updated',
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
