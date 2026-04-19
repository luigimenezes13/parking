import { type ParkingSessionRepository } from '@domain/parking/aggregates/parking-session/parking-session-repository.ts';
import { DuplicateActiveSessionForSpotError } from '@domain/parking/errors/duplicate-active-session-for-spot.ts';
import { DuplicateActiveSessionForVehicleError } from '@domain/parking/errors/duplicate-active-session-for-vehicle.ts';
import { type LicensePlateVO } from '@domain/parking/value-objects/license-plate-vo.ts';
import { type SpotCodeVO } from '@domain/parking/value-objects/spot-code-vo.ts';

export class ActiveSessionPolicy {
  private readonly sessions: ParkingSessionRepository;

  constructor(sessions: ParkingSessionRepository) {
    this.sessions = sessions;
  }

  async ensureVehicleHasNoActiveSession(licensePlate: LicensePlateVO): Promise<void> {
    const active = await this.sessions.findActiveByLicensePlate(licensePlate);

    if (active) {
      throw new DuplicateActiveSessionForVehicleError(licensePlate.value());
    }
  }

  async ensureSpotHasNoActiveSession(spotCode: SpotCodeVO): Promise<void> {
    const active = await this.sessions.findActiveBySpotCode(spotCode);

    if (active) {
      throw new DuplicateActiveSessionForSpotError(spotCode.value());
    }
  }
}
