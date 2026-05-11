import { inject, injectable } from 'inversify';

import { type UseCase } from '@app/shared/use-case.ts';
import { TYPES } from '@app/dto/types.ts';
import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { SpotTypeVO } from '@domain/parking/value-objects/spot-type-vo.ts';
import { type ParkingSpot } from '@domain/parking/entities/parking-spot.ts';
import { type ParkingSpotRepository } from '@domain/parking/repositories/parking-spot-repository.ts';
import { ParkingSpotNotFoundError } from '@app/exceptions/parking-spot/parking-spot-not-found-error.ts';
import { DuplicateSpotPositionError } from '@app/exceptions/parking-spot/duplicate-spot-position-error.ts';

export interface UpdateParkingSpotMetadataInput {
  parkingSpotId: string;
  floor: number;
  row: number;
  column: number;
  isCovered: boolean;
  spotType: 'REGULAR' | 'COMPACT' | 'LARGE' | 'MOTORCYCLE' | 'ACCESSIBLE' | 'ELECTRIC';
}

@injectable()
export class UpdateParkingSpotMetadataUseCase implements UseCase<
  UpdateParkingSpotMetadataInput,
  ParkingSpot
> {
  private readonly parkingSpots: ParkingSpotRepository;

  constructor(@inject(TYPES.ParkingSpotRepository) parkingSpots: ParkingSpotRepository) {
    this.parkingSpots = parkingSpots;
  }

  async execute(input: UpdateParkingSpotMetadataInput): Promise<ParkingSpot> {
    const spotId = UniqueIdentifier.fromExisting(input.parkingSpotId);
    const spot = await this.parkingSpots.findById(spotId);

    if (!spot) {
      throw new ParkingSpotNotFoundError(input.parkingSpotId);
    }

    const positionChanged =
      spot.floor() !== input.floor || spot.row() !== input.row || spot.column() !== input.column;

    if (positionChanged) {
      const collision = await this.parkingSpots.findByPosition({
        parkingLotId: spot.parkingLotId(),
        floor: input.floor,
        row: input.row,
        column: input.column,
      });
      if (collision && !collision.id().equals(spot.id())) {
        throw new DuplicateSpotPositionError(
          spot.parkingLotId().value(),
          input.floor,
          input.row,
          input.column,
        );
      }
    }

    spot.updateMetadata({
      floor: input.floor,
      row: input.row,
      column: input.column,
      isCovered: input.isCovered,
      spotType: SpotTypeVO.fromExisting(input.spotType),
    });

    await this.parkingSpots.save(spot);

    return spot;
  }
}
