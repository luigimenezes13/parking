import { Entity } from '@domain/shared/entity.ts';
import { type UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { type SpotCodeVO } from '@domain/parking/value-objects/spot-code-vo.ts';
import { SpotStatusVO } from '@domain/parking/value-objects/spot-status-vo.ts';

interface ParkingSpotProperties {
  parkingLotId: UniqueIdentifier;
  code: SpotCodeVO;
  floor: number;
  isCovered: boolean;
  status: SpotStatusVO;
}

export interface ParkingSpotRegistration {
  parkingLotId: UniqueIdentifier;
  code: SpotCodeVO;
  floor: number;
  isCovered: boolean;
}

export interface ParkingSpotRehydration {
  identifier: UniqueIdentifier;
  parkingLotId: UniqueIdentifier;
  code: SpotCodeVO;
  floor: number;
  isCovered: boolean;
  status: SpotStatusVO;
}

export class ParkingSpot extends Entity<ParkingSpotProperties> {
  private constructor(properties: ParkingSpotProperties, identifier?: UniqueIdentifier) {
    super(properties, identifier);
  }

  static register(registration: ParkingSpotRegistration): ParkingSpot {
    return new ParkingSpot({
      parkingLotId: registration.parkingLotId,
      code: registration.code,
      floor: registration.floor,
      isCovered: registration.isCovered,
      status: SpotStatusVO.free(),
    });
  }

  static rehydrate(rehydration: ParkingSpotRehydration): ParkingSpot {
    return new ParkingSpot(
      {
        parkingLotId: rehydration.parkingLotId,
        code: rehydration.code,
        floor: rehydration.floor,
        isCovered: rehydration.isCovered,
        status: rehydration.status,
      },
      rehydration.identifier,
    );
  }

  occupyBySession(): void {
    this.properties.status = this.properties.status.occupy(this.properties.code.value());
  }

  releaseBySession(): void {
    this.properties.status = this.properties.status.release(this.properties.code.value());
  }

  belongsTo(parkingLotId: UniqueIdentifier): boolean {
    return this.properties.parkingLotId.equals(parkingLotId);
  }

  id(): UniqueIdentifier {
    return this.identifier;
  }

  parkingLotId(): UniqueIdentifier {
    return this.properties.parkingLotId;
  }

  code(): SpotCodeVO {
    return this.properties.code;
  }

  floor(): number {
    return this.properties.floor;
  }

  isCovered(): boolean {
    return this.properties.isCovered;
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
}
