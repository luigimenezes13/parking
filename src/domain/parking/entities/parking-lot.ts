import { Entity } from '@domain/shared/entity.ts';
import { type UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';

export interface ParkingLotProperties {
  name: string;
  address: string;
  totalCapacity: number;
}

export class ParkingLot extends Entity<ParkingLotProperties> {
  private constructor(properties: ParkingLotProperties, identifier?: UniqueIdentifier) {
    super(properties, identifier);
  }

  static register(properties: ParkingLotProperties): ParkingLot {
    return new ParkingLot(properties);
  }

  static rehydrate(identifier: UniqueIdentifier, properties: ParkingLotProperties): ParkingLot {
    return new ParkingLot(properties, identifier);
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
}
