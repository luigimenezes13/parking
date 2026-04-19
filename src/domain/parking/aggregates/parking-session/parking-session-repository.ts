import { type UniqueIdentifier } from '../../../shared/value-objects/unique-identifier.ts';
import { type LicensePlate } from '../../value-objects/license-plate.ts';
import { type SpotCode } from '../../value-objects/spot-code.ts';
import { type ParkingSession } from './parking-session.ts';

export interface ParkingSessionRepository {
  save(session: ParkingSession): Promise<void>;
  findById(identifier: UniqueIdentifier): Promise<ParkingSession | null>;
  findActiveByLicensePlate(licensePlate: LicensePlate): Promise<ParkingSession | null>;
  findActiveBySpotCode(spotCode: SpotCode): Promise<ParkingSession | null>;
}
