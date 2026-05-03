import { type UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { type ParkingSpot } from '@domain/parking/entities/parking-spot.ts';
import { type SpotCodeVO } from '@domain/parking/value-objects/spot-code-vo.ts';
import { type ParkingSpotRepository } from '@domain/parking/repositories/parking-spot-repository.ts';

export class InMemoryParkingSpotRepository implements ParkingSpotRepository {
  private readonly spots = new Map<string, ParkingSpot>();

  async save(spot: ParkingSpot): Promise<void> {
    this.spots.set(spot.id().value(), spot);
  }

  async findById(identifier: UniqueIdentifier): Promise<ParkingSpot | null> {
    return this.spots.get(identifier.value()) ?? null;
  }

  async findByCode(parkingLotId: UniqueIdentifier, code: SpotCodeVO): Promise<ParkingSpot | null> {
    for (const spot of this.spots.values()) {
      if (spot.parkingLotId().equals(parkingLotId) && spot.code().equals(code)) {
        return spot;
      }
    }
    return null;
  }

  async findFreeByParkingLot(parkingLotId: UniqueIdentifier): Promise<ParkingSpot[]> {
    const free: ParkingSpot[] = [];
    for (const spot of this.spots.values()) {
      if (spot.parkingLotId().equals(parkingLotId) && spot.isFree()) {
        free.push(spot);
      }
    }
    return free;
  }
}
