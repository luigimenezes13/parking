import { Entity } from '@domain/shared/entity.ts';
import { type UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { type LicensePlateVO } from '@domain/parking/value-objects/license-plate-vo.ts';

export interface VehicleProperties {
  driverId: UniqueIdentifier;
  licensePlate: LicensePlateVO;
  brand: string | null;
  model: string;
  color: string;
}

export class Vehicle extends Entity<VehicleProperties> {
  private constructor(properties: VehicleProperties, identifier?: UniqueIdentifier) {
    super(properties, identifier);
  }

  static register(properties: VehicleProperties): Vehicle {
    return new Vehicle(properties);
  }

  static rehydrate(identifier: UniqueIdentifier, properties: VehicleProperties): Vehicle {
    return new Vehicle(properties, identifier);
  }

  transferOwnershipTo(newDriverId: UniqueIdentifier): void {
    this.properties.driverId = newDriverId;
  }

  updateAppearance(appearance: { brand: string | null; model: string; color: string }): void {
    this.properties.brand = appearance.brand;
    this.properties.model = appearance.model;
    this.properties.color = appearance.color;
  }

  belongsTo(driverId: UniqueIdentifier): boolean {
    return this.properties.driverId.equals(driverId);
  }

  id(): UniqueIdentifier {
    return this.identifier;
  }

  driverId(): UniqueIdentifier {
    return this.properties.driverId;
  }

  licensePlate(): LicensePlateVO {
    return this.properties.licensePlate;
  }

  brand(): string | null {
    return this.properties.brand;
  }

  model(): string {
    return this.properties.model;
  }

  color(): string {
    return this.properties.color;
  }
}
