import { AggregateRoot } from '@domain/shared/aggregate-root.ts';
import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { type SpotCodeVO } from '@domain/parking/value-objects/spot-code-vo.ts';
import { SpotStatusVO } from '@domain/parking/value-objects/spot-status-vo.ts';
import { spotOccupiedMapper } from '@domain/parking/aggregates/parking-spot/events/spot-occupied-mapper.ts';
import { spotRegisteredMapper } from '@domain/parking/aggregates/parking-spot/events/spot-registered-mapper.ts';
import { spotReleasedMapper } from '@domain/parking/aggregates/parking-spot/events/spot-released-mapper.ts';
import { spotReservedMapper } from '@domain/parking/aggregates/parking-spot/events/spot-reserved-mapper.ts';

interface ParkingSpotProperties {
  code: SpotCodeVO;
  status: SpotStatusVO;
}

export interface ParkingSpotRegistration {
  code: SpotCodeVO;
}

export interface ParkingSpotRehydration {
  code: SpotCodeVO;
  status: SpotStatusVO;
}

export class ParkingSpot extends AggregateRoot<ParkingSpotProperties> {
  private constructor(identifier: UniqueIdentifier, properties: ParkingSpotProperties) {
    super(identifier, properties);
  }

  static register(registration: ParkingSpotRegistration): ParkingSpot {
    const identifier = UniqueIdentifier.fromExisting(registration.code.value());
    const spot = new ParkingSpot(identifier, {
      code: registration.code,
      status: SpotStatusVO.free(),
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

  code(): SpotCodeVO {
    return this.properties.code;
  }

  status(): SpotStatusVO {
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

  hasCode(code: SpotCodeVO): boolean {
    return this.properties.code.equals(code);
  }
}
