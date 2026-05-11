import { type UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { type ParkingLot } from '@domain/parking/entities/parking-lot.ts';
import { type ParkingLotRepository } from '@domain/parking/repositories/parking-lot-repository.ts';

export class InMemoryParkingLotRepository implements ParkingLotRepository {
  private readonly lots = new Map<string, ParkingLot>();

  async save(parkingLot: ParkingLot): Promise<void> {
    this.lots.set(parkingLot.id().value(), parkingLot);
  }

  async findById(identifier: UniqueIdentifier): Promise<ParkingLot | null> {
    return this.lots.get(identifier.value()) ?? null;
  }

  async findAll(): Promise<ParkingLot[]> {
    const active: ParkingLot[] = [];
    for (const lot of this.lots.values()) {
      if (lot.isActive()) {
        active.push(lot);
      }
    }
    return active;
  }
}
