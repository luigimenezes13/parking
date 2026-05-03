import { type UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { type LicensePlateVO } from '@domain/parking/value-objects/license-plate-vo.ts';
import { type ParkingSession } from '@domain/parking/aggregates/parking-session/parking-session.ts';

export interface ParkingSessionRepository {
  save(session: ParkingSession): Promise<void>;
  findById(identifier: UniqueIdentifier): Promise<ParkingSession | null>;
  findActiveByPlate(licensePlate: LicensePlateVO): Promise<ParkingSession | null>;
  findActiveBySpot(spotId: UniqueIdentifier): Promise<ParkingSession | null>;
  findOldestPendingVehicle(parkingLotId: UniqueIdentifier): Promise<ParkingSession | null>;
  findMostRecentActive(parkingLotId: UniqueIdentifier): Promise<ParkingSession | null>;
}
