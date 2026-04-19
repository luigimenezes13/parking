import { AggregateRoot } from '../../../shared/aggregate-root.ts';
import { UniqueIdentifier } from '../../../shared/value-objects/unique-identifier.ts';
import { SpotCode } from '../../value-objects/spot-code.ts';
import { SpotStatus } from '../../value-objects/spot-status.ts';
import { spotOccupiedMapper } from './events/spot-occupied-mapper.ts';
import { spotRegisteredMapper } from './events/spot-registered-mapper.ts';
import { spotReleasedMapper } from './events/spot-released-mapper.ts';
import { spotReservedMapper } from './events/spot-reserved-mapper.ts';

interface ParkingSpotProperties {
  code: SpotCode;
  status: SpotStatus;
}

export interface ParkingSpotRegistration {
  code: SpotCode;
}

export interface ParkingSpotRehydration {
  code: SpotCode;
  status: SpotStatus;
}

export class ParkingSpot extends AggregateRoot<ParkingSpotProperties> {
  private constructor(identifier: UniqueIdentifier, properties: ParkingSpotProperties) {
    super(identifier, properties);
  }

  static register(registration: ParkingSpotRegistration): ParkingSpot {
    const identifier = UniqueIdentifier.fromExisting(registration.code.value());
    const spot = new ParkingSpot(identifier, {
      code: registration.code,
      status: SpotStatus.free(),
    });
    spot.addDomainEvent(spotRegisteredMapper.toEvent(spot));
    return spot;
  }

  static rehydrate(rehydration: ParkingSpotRehydration): ParkingSpot {
    const identifier = UniqueIdentifier.fromExisting(rehydration.code.value());
    return new ParkingSpot(identifier, { ...rehydration });
  }

  occupy(): void {
    this.properties.status = this.properties.status.occupy(this.properties.code.value());
    this.addDomainEvent(spotOccupiedMapper.toEvent(this));
  }

  reserve(): void {
    this.properties.status = this.properties.status.reserve(this.properties.code.value());
    this.addDomainEvent(spotReservedMapper.toEvent(this));
  }

  release(): void {
    this.properties.status = this.properties.status.release(this.properties.code.value());
    this.addDomainEvent(spotReleasedMapper.toEvent(this));
  }

  id(): UniqueIdentifier {
    return this.identifier;
  }

  code(): SpotCode {
    return this.properties.code;
  }

  status(): SpotStatus {
    return this.properties.status;
  }

  isFree(): boolean {
    return this.properties.status.isFree();
  }

  isOccupied(): boolean {
    return this.properties.status.isOccupied();
  }

  isReserved(): boolean {
    return this.properties.status.isReserved();
  }

  hasCode(code: SpotCode): boolean {
    return this.properties.code.equals(code);
  }
}
