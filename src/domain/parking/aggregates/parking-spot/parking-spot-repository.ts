import { type SpotCode } from '../../value-objects/spot-code.ts';
import { type ParkingSpot } from './parking-spot.ts';

export interface ParkingSpotRepository {
  save(spot: ParkingSpot): Promise<void>;
  findByCode(code: SpotCode): Promise<ParkingSpot | null>;
  findAllFree(): Promise<ParkingSpot[]>;
}
