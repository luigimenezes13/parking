import { Entity } from '@domain/shared/entity.ts';
import { type UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { type LicensePlateVO } from '@domain/parking/value-objects/license-plate-vo.ts';
import { EntityAlreadyDeactivatedError } from '@domain/parking/errors/entity-already-deactivated.ts';

export interface VehicleProperties {
  driverId: UniqueIdentifier | null;
  parkingLotId: UniqueIdentifier;
  licensePlate: LicensePlateVO;
  brand: string | null;
  model: string | null;
  color: string | null;
  deactivatedAt?: Date | null;
}

export interface VehicleAppearance {
  brand: string | null;
  model: string | null;
  color: string | null;
}

export class Vehicle extends Entity<VehicleProperties> {
  constructor(properties: VehicleProperties, identifier?: UniqueIdentifier) {
    super({ ...properties, deactivatedAt: properties.deactivatedAt ?? null }, identifier);
  }

  static register(properties: Omit<VehicleProperties, 'deactivatedAt'>): Vehicle {
    return new Vehicle({ ...properties, deactivatedAt: null });
  }

  static registerAnonymous(properties: {
    parkingLotId: UniqueIdentifier;
    licensePlate: LicensePlateVO;
    brand?: string | null;
    model?: string | null;
    color?: string | null;
  }): Vehicle {
    return new Vehicle({
      driverId: null,
      parkingLotId: properties.parkingLotId,
      licensePlate: properties.licensePlate,
      brand: properties.brand ?? null,
      model: properties.model ?? null,
      color: properties.color ?? null,
      deactivatedAt: null,
    });
  }

  transferOwnershipTo(newDriverId: UniqueIdentifier): void {
    this.properties.driverId = newDriverId;
  }

  updateAppearance(appearance: VehicleAppearance): void {
    this.properties.brand = appearance.brand;
    this.properties.model = appearance.model;
    this.properties.color = appearance.color;
  }

  deactivate(now: Date): void {
    if (this.isDeactivated()) {
      throw new EntityAlreadyDeactivatedError('Vehicle', this.identifier.value());
    }

    this.properties.deactivatedAt = new Date(now.getTime());
  }

  isDeactivated(): boolean {
    return this.properties.deactivatedAt != null;
  }

  isActive(): boolean {
    return !this.isDeactivated();
  }

  belongsTo(driverId: UniqueIdentifier): boolean {
    if (this.properties.driverId === null) {
      return false;
    }

    return this.properties.driverId.equals(driverId);
  }

  hasDriver(): boolean {
    return this.properties.driverId !== null;
  }

  id(): UniqueIdentifier {
    return this.identifier;
  }

  driverId(): UniqueIdentifier | null {
    return this.properties.driverId;
  }

  parkingLotId(): UniqueIdentifier {
    return this.properties.parkingLotId;
  }

  licensePlate(): LicensePlateVO {
    return this.properties.licensePlate;
  }

  brand(): string | null {
    return this.properties.brand;
  }

  model(): string | null {
    return this.properties.model;
  }

  color(): string | null {
    return this.properties.color;
  }

  deactivatedAt(): Date | null {
    return this.properties.deactivatedAt ? new Date(this.properties.deactivatedAt.getTime()) : null;
  }
}
