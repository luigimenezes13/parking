import { AggregateRoot } from '../../../shared/aggregate-root.ts';
import { UniqueIdentifier } from '../../../shared/value-objects/unique-identifier.ts';
import { LicensePlate } from '../../value-objects/license-plate.ts';
import { vehicleAppearanceUpdatedMapper } from './events/vehicle-appearance-updated-mapper.ts';
import { vehicleRegisteredMapper } from './events/vehicle-registered-mapper.ts';

interface VehicleProperties {
  licensePlate: LicensePlate;
  model: string;
  brand: string;
  color: string;
}

export interface VehicleRegistration {
  licensePlate: LicensePlate;
  model: string;
  brand: string;
  color: string;
}

export interface VehicleAppearance {
  model: string;
  brand: string;
  color: string;
}

export class Vehicle extends AggregateRoot<VehicleProperties> {
  private constructor(identifier: UniqueIdentifier, properties: VehicleProperties) {
    super(identifier, properties);
  }

  static register(registration: VehicleRegistration): Vehicle {
    const identifier = UniqueIdentifier.fromExisting(registration.licensePlate.value());
    const vehicle = new Vehicle(identifier, { ...registration });
    vehicle.addDomainEvent(vehicleRegisteredMapper.toEvent(vehicle));
    return vehicle;
  }

  static rehydrate(registration: VehicleRegistration): Vehicle {
    const identifier = UniqueIdentifier.fromExisting(registration.licensePlate.value());
    return new Vehicle(identifier, { ...registration });
  }

  updateAppearance(appearance: VehicleAppearance): void {
    this.properties.model = appearance.model;
    this.properties.brand = appearance.brand;
    this.properties.color = appearance.color;
    this.addDomainEvent(vehicleAppearanceUpdatedMapper.toEvent(this));
  }

  id(): UniqueIdentifier {
    return this.identifier;
  }

  licensePlate(): LicensePlate {
    return this.properties.licensePlate;
  }

  model(): string {
    return this.properties.model;
  }

  brand(): string {
    return this.properties.brand;
  }

  color(): string {
    return this.properties.color;
  }
}
