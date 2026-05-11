import { inject, injectable } from 'inversify';

import { type UseCase } from '@app/shared/use-case.ts';
import { TYPES } from '@app/dto/types.ts';
import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { type ParkingSpot } from '@domain/parking/entities/parking-spot.ts';
import { type ParkingLotRepository } from '@domain/parking/repositories/parking-lot-repository.ts';
import { type ParkingSpotRepository } from '@domain/parking/repositories/parking-spot-repository.ts';
import { ParkingLotNotFoundError } from '@app/exceptions/parking-lot/parking-lot-not-found-error.ts';

export interface ListParkingSpotsByLotInput {
  parkingLotId: string;
}

@injectable()
export class ListParkingSpotsByLotUseCase implements UseCase<
  ListParkingSpotsByLotInput,
  ParkingSpot[]
> {
  private readonly parkingSpots: ParkingSpotRepository;
  private readonly parkingLots: ParkingLotRepository;

  constructor(
    @inject(TYPES.ParkingSpotRepository) parkingSpots: ParkingSpotRepository,
    @inject(TYPES.ParkingLotRepository) parkingLots: ParkingLotRepository,
  ) {
    this.parkingSpots = parkingSpots;
    this.parkingLots = parkingLots;
  }

  async execute(input: ListParkingSpotsByLotInput): Promise<ParkingSpot[]> {
    const parkingLotId = UniqueIdentifier.fromExisting(input.parkingLotId);
    const parkingLot = await this.parkingLots.findById(parkingLotId);
    if (!parkingLot) {
      throw new ParkingLotNotFoundError(input.parkingLotId);
    }

    return this.parkingSpots.findByParkingLot(parkingLotId);
  }
}
