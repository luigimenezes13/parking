import { type DomainEventMapper } from '@domain/shared/events/domain-event-mapper.ts';
import { type Vehicle } from '@domain/parking/aggregates/vehicle/vehicle.ts';
import { type VehicleAppearanceUpdated } from '@domain/parking/aggregates/vehicle/events/vehicle-appearance-updated.ts';

export const vehicleAppearanceUpdatedMapper: DomainEventMapper<Vehicle, VehicleAppearanceUpdated> =
  {
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
