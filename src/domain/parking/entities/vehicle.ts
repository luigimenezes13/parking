import { Entity } from '@domain/shared/entity.ts';
import { type UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { type LicensePlateVO } from '@domain/parking/value-objects/license-plate-vo.ts';

interface VehicleProperties {
  driverId: UniqueIdentifier;
  licensePlate: LicensePlateVO;
  brand: string | null;
  model: string;
  color: string;
}

export interface VehicleRegistration {
  driverId: UniqueIdentifier;
  licensePlate: LicensePlateVO;
  brand?: string | null;
  model: string;
  color: string;
}

export interface VehicleRehydration extends VehicleRegistration {
  identifier: UniqueIdentifier;
}

export interface VehicleAppearance {
  brand?: string | null;
  model: string;
  color: string;
}

export class Vehicle extends Entity<VehicleProperties> {
  private constructor(properties: VehicleProperties, identifier?: UniqueIdentifier) {
    super(properties, identifier);
  }

  static register(registration: VehicleRegistration): Vehicle {
    return new Vehicle({
      driverId: registration.driverId,
      licensePlate: registration.licensePlate,
      brand: registration.brand ?? null,
      model: registration.model,
      color: registration.color,
    });
  }

  static rehydrate(rehydration: VehicleRehydration): Vehicle {
    return new Vehicle(
      {
        driverId: rehydration.driverId,
        licensePlate: rehydration.licensePlate,
        brand: rehydration.brand ?? null,
        model: rehydration.model,
        color: rehydration.color,
      },
      rehydration.identifier,
    );
  }

  transferOwnershipTo(newDriverId: UniqueIdentifier): void {
    this.properties.driverId = newDriverId;
  }

  updateAppearance(appearance: VehicleAppearance): void {
    this.properties.brand = appearance.brand ?? null;
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
