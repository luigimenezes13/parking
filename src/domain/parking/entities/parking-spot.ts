import { Entity } from '@domain/shared/entity.ts';
import { type UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { type SpotCodeVO } from '@domain/parking/value-objects/spot-code-vo.ts';
import { SpotStatusVO } from '@domain/parking/value-objects/spot-status-vo.ts';
import { EntityAlreadyDeactivatedError } from '@domain/parking/errors/entity-already-deactivated.ts';

export interface ParkingSpotProperties {
  parkingLotId: UniqueIdentifier;
  code: SpotCodeVO;
  floor: number;
  isCovered: boolean;
  status: SpotStatusVO;
  deactivatedAt?: Date | null;
}

export class ParkingSpot extends Entity<ParkingSpotProperties> {
  constructor(properties: ParkingSpotProperties, identifier?: UniqueIdentifier) {
    super({ ...properties, deactivatedAt: properties.deactivatedAt ?? null }, identifier);
  }

  static register(
    properties: Omit<ParkingSpotProperties, 'status' | 'deactivatedAt'>,
  ): ParkingSpot {
    return new ParkingSpot({
      ...properties,
      status: SpotStatusVO.free(),
      deactivatedAt: null,
    });
  }

  occupyBySession(): void {
    this.properties.status = this.properties.status.occupy(this.properties.code.value());
  }

  releaseBySession(): void {
    this.properties.status = this.properties.status.release(this.properties.code.value());
  }

  deactivate(now: Date): void {
    if (this.isDeactivated()) {
      throw new EntityAlreadyDeactivatedError('ParkingSpot', this.identifier.value());
    }

    this.properties.deactivatedAt = new Date(now.getTime());
  }

  isDeactivated(): boolean {
    return this.properties.deactivatedAt != null;
  }

  isActive(): boolean {
    return !this.isDeactivated();
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

  deactivatedAt(): Date | null {
    return this.properties.deactivatedAt ? new Date(this.properties.deactivatedAt.getTime()) : null;
  }
}
