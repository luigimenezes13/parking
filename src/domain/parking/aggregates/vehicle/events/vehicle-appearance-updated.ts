import { type DomainEvent } from '../../../../shared/events/domain-event.ts';

export interface VehicleAppearanceUpdatedPayload {
  vehicleId: string;
  licensePlate: string;
  model: string;
  brand: string;
  color: string;
}

export interface VehicleAppearanceUpdated extends DomainEvent<VehicleAppearanceUpdatedPayload> {
  readonly eventName: 'parking.vehicle.appearance-updated';
}
