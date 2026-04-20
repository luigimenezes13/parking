import { Entity } from '@domain/shared/entity.ts';
import { type UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { type LicensePlateVO } from '@domain/parking/value-objects/license-plate-vo.ts';

interface VehicleProperties {
  licensePlate: LicensePlateVO;
  brand: string | null;
  model: string;
  color: string;
}

export interface VehicleRegistration {
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
      licensePlate: registration.licensePlate,
      brand: registration.brand ?? null,
      model: registration.model,
      color: registration.color,
    });
  }

  static rehydrate(rehydration: VehicleRehydration): Vehicle {
    return new Vehicle(
      {
        licensePlate: rehydration.licensePlate,
        brand: rehydration.brand ?? null,
        model: rehydration.model,
        color: rehydration.color,
      },
      rehydration.identifier,
    );
  }

  updateAppearance(appearance: VehicleAppearance): void {
    this.properties.brand = appearance.brand ?? null;
    this.properties.model = appearance.model;
    this.properties.color = appearance.color;
  }

  id(): UniqueIdentifier {
    return this.identifier;
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
