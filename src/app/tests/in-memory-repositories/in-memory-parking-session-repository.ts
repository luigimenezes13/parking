import { type UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { type LicensePlateVO } from '@domain/parking/value-objects/license-plate-vo.ts';
import { type ParkingSession } from '@domain/parking/aggregates/parking-session/parking-session.ts';
import { type ParkingSessionRepository } from '@domain/parking/repositories/parking-session-repository.ts';

export class InMemoryParkingSessionRepository implements ParkingSessionRepository {
  private readonly sessions = new Map<string, ParkingSession>();

  async save(session: ParkingSession): Promise<void> {
    this.sessions.set(session.id().value(), session);
  }

  async findById(identifier: UniqueIdentifier): Promise<ParkingSession | null> {
    return this.sessions.get(identifier.value()) ?? null;
  }

  async findActiveByPlate(licensePlate: LicensePlateVO): Promise<ParkingSession | null> {
    for (const session of this.sessions.values()) {
      if (session.isActive() && session.licensePlate().equals(licensePlate)) {
        return session;
      }
    }
    return null;
  }

  async findActiveBySpot(spotId: UniqueIdentifier): Promise<ParkingSession | null> {
    for (const session of this.sessions.values()) {
      if (!session.isActive()) continue;
      const spot = session.spot();
      if (spot && spot.id().equals(spotId)) {
        return session;
      }
    }
    return null;
  }
}
