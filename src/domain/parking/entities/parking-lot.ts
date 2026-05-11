import { Entity } from '@domain/shared/entity.ts';
import { type UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { EntityAlreadyDeactivatedError } from '@domain/parking/errors/entity-already-deactivated.ts';

export interface ParkingLotProperties {
  name: string;
  address: string;
  totalCapacity: number;
  deactivatedAt?: Date | null;
}

export interface ParkingLotInfo {
  name: string;
  address: string;
  totalCapacity: number;
}

export class ParkingLot extends Entity<ParkingLotProperties> {
  constructor(properties: ParkingLotProperties, identifier?: UniqueIdentifier) {
    super({ ...properties, deactivatedAt: properties.deactivatedAt ?? null }, identifier);
  }

  static register(properties: Omit<ParkingLotProperties, 'deactivatedAt'>): ParkingLot {
    return new ParkingLot({ ...properties, deactivatedAt: null });
  }

  updateInfo(info: ParkingLotInfo): void {
    this.properties.name = info.name;
    this.properties.address = info.address;
    this.properties.totalCapacity = info.totalCapacity;
  }

  deactivate(now: Date): void {
    if (this.isDeactivated()) {
      throw new EntityAlreadyDeactivatedError('ParkingLot', this.identifier.value());
    }

    this.properties.deactivatedAt = new Date(now.getTime());
  }

  isDeactivated(): boolean {
    return this.properties.deactivatedAt != null;
  }

  isActive(): boolean {
    return !this.isDeactivated();
  }

  id(): UniqueIdentifier {
    return this.identifier;
  }

  name(): string {
    return this.properties.name;
  }

  address(): string {
    return this.properties.address;
  }

  totalCapacity(): number {
    return this.properties.totalCapacity;
  }

  deactivatedAt(): Date | null {
    return this.properties.deactivatedAt ? new Date(this.properties.deactivatedAt.getTime()) : null;
  }
}
