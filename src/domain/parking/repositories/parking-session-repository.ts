import { type UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { type LicensePlateVO } from '@domain/parking/value-objects/license-plate-vo.ts';
import { type SpotCodeVO } from '@domain/parking/value-objects/spot-code-vo.ts';
import { type ParkingSession } from '@domain/parking/aggregates/parking-session/parking-session.ts';

export interface ParkingSessionRepository {
  save(session: ParkingSession): Promise<void>;
  findById(identifier: UniqueIdentifier): Promise<ParkingSession | null>;
  findActiveByLicensePlate(licensePlate: LicensePlateVO): Promise<ParkingSession | null>;
  findActiveBySpotCode(spotCode: SpotCodeVO): Promise<ParkingSession | null>;
}
