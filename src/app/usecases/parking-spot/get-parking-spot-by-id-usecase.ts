import { inject, injectable } from 'inversify';

import { type UseCase } from '@app/shared/use-case.ts';
import { TYPES } from '@app/dto/types.ts';
import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { type ParkingSpot } from '@domain/parking/entities/parking-spot.ts';
import { type ParkingSpotRepository } from '@domain/parking/repositories/parking-spot-repository.ts';
import { ParkingSpotNotFoundError } from '@app/exceptions/parking-spot/parking-spot-not-found-error.ts';

export interface GetParkingSpotByIdInput {
  parkingSpotId: string;
}

@injectable()
export class GetParkingSpotByIdUseCase implements UseCase<GetParkingSpotByIdInput, ParkingSpot> {
  private readonly parkingSpots: ParkingSpotRepository;

  constructor(@inject(TYPES.ParkingSpotRepository) parkingSpots: ParkingSpotRepository) {
    this.parkingSpots = parkingSpots;
  }

  async execute(input: GetParkingSpotByIdInput): Promise<ParkingSpot> {
    const spot = await this.parkingSpots.findById(
      UniqueIdentifier.fromExisting(input.parkingSpotId),
    );

    if (!spot) {
      throw new ParkingSpotNotFoundError(input.parkingSpotId);
    }

    return spot;
  }
}
