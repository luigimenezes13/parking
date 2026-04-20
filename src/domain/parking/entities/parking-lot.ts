import { Entity } from '@domain/shared/entity.ts';
import { type UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';

interface ParkingLotProperties {
  name: string;
  address: string;
  totalCapacity: number;
}

export interface ParkingLotRegistration {
  name: string;
  address: string;
  totalCapacity: number;
}

export interface ParkingLotRehydration extends ParkingLotRegistration {
  identifier: UniqueIdentifier;
}

export class ParkingLot extends Entity<ParkingLotProperties> {
  private constructor(properties: ParkingLotProperties, identifier?: UniqueIdentifier) {
    super(properties, identifier);
  }

  static register(registration: ParkingLotRegistration): ParkingLot {
    return new ParkingLot({
      name: registration.name,
      address: registration.address,
      totalCapacity: registration.totalCapacity,
    });
  }

  static rehydrate(rehydration: ParkingLotRehydration): ParkingLot {
    return new ParkingLot(
      {
        name: rehydration.name,
        address: rehydration.address,
        totalCapacity: rehydration.totalCapacity,
      },
      rehydration.identifier,
    );
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
