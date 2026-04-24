import { type UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { type SpotCodeVO } from '@domain/parking/value-objects/spot-code-vo.ts';
import { type ParkingSpot } from '@domain/parking/entities/parking-spot.ts';

export interface ParkingSpotRepository {
  save(spot: ParkingSpot): Promise<void>;
  findById(identifier: UniqueIdentifier): Promise<ParkingSpot | null>;
  findByCode(parkingLotId: UniqueIdentifier, code: SpotCodeVO): Promise<ParkingSpot | null>;
  findFreeByParkingLot(parkingLotId: UniqueIdentifier): Promise<ParkingSpot[]>;
}
