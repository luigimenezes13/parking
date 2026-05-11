import { type UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { type SpotCodeVO } from '@domain/parking/value-objects/spot-code-vo.ts';
import { type ParkingSpot } from '@domain/parking/entities/parking-spot.ts';

export interface ParkingSpotPosition {
  parkingLotId: UniqueIdentifier;
  floor: number;
  row: number;
  column: number;
}

export interface ParkingSpotRepository {
  save(spot: ParkingSpot): Promise<void>;
  findById(identifier: UniqueIdentifier): Promise<ParkingSpot | null>;
  findByCode(parkingLotId: UniqueIdentifier, code: SpotCodeVO): Promise<ParkingSpot | null>;
  findByPosition(position: ParkingSpotPosition): Promise<ParkingSpot | null>;
  findByParkingLot(parkingLotId: UniqueIdentifier): Promise<ParkingSpot[]>;
  findFreeByParkingLot(parkingLotId: UniqueIdentifier): Promise<ParkingSpot[]>;
}
