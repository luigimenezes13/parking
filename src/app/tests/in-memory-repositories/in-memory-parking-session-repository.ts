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
      if (!session.isActive()) continue;
      const plate = session.licensePlate();
      if (plate && plate.equals(licensePlate)) {
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

  async findOldestPendingVehicle(parkingLotId: UniqueIdentifier): Promise<ParkingSession | null> {
    let oldest: ParkingSession | null = null;
    for (const session of this.sessions.values()) {
      if (!session.isActive()) continue;
      if (!session.parkingLotId().equals(parkingLotId)) continue;
      if (session.vehicle() !== null) continue;
      if (!oldest || session.entryAt().getTime() < oldest.entryAt().getTime()) {
        oldest = session;
      }
    }
    return oldest;
  }

  async findMostRecentActive(parkingLotId: UniqueIdentifier): Promise<ParkingSession | null> {
    let mostRecent: ParkingSession | null = null;
    for (const session of this.sessions.values()) {
      if (!session.isActive()) continue;
      if (!session.parkingLotId().equals(parkingLotId)) continue;
      if (!mostRecent || session.entryAt().getTime() > mostRecent.entryAt().getTime()) {
        mostRecent = session;
      }
    }
    return mostRecent;
  }
}
