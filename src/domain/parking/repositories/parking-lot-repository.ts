import { type UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { type ParkingLot } from '@domain/parking/entities/parking-lot.ts';

export interface ParkingLotRepository {
  save(parkingLot: ParkingLot): Promise<void>;
  findById(identifier: UniqueIdentifier): Promise<ParkingLot | null>;
  findAll(): Promise<ParkingLot[]>;
}
