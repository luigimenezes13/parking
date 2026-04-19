import { type SpotCodeVO } from '@domain/parking/value-objects/spot-code-vo.ts';
import { type ParkingSpot } from '@domain/parking/aggregates/parking-spot/parking-spot.ts';

export interface ParkingSpotRepository {
  save(spot: ParkingSpot): Promise<void>;
  findByCode(code: SpotCodeVO): Promise<ParkingSpot | null>;
  findAllFree(): Promise<ParkingSpot[]>;
}
