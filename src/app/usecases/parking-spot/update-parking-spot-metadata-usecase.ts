import { inject, injectable } from 'inversify';

import { type UseCase } from '@app/shared/use-case.ts';
import { TYPES } from '@app/dto/types.ts';
import { type UpdateParkingSpotMetadataRequest } from '@app/dto/inputs/parking-spot/update-parking-spot-metadata-input.ts';
import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { SpotTypeVO } from '@domain/parking/value-objects/spot-type-vo.ts';
import { type ParkingSpot } from '@domain/parking/entities/parking-spot.ts';
import { type ParkingSpotRepository } from '@domain/parking/repositories/parking-spot-repository.ts';
import { ParkingSpotNotFoundError } from '@app/exceptions/parking-spot/parking-spot-not-found-error.ts';
import { DuplicateSpotPositionError } from '@app/exceptions/parking-spot/duplicate-spot-position-error.ts';

@injectable()
export class UpdateParkingSpotMetadataUseCase implements UseCase<
  UpdateParkingSpotMetadataRequest,
  ParkingSpot
> {
  private readonly parkingSpots: ParkingSpotRepository;

  constructor(@inject(TYPES.ParkingSpotRepository) parkingSpots: ParkingSpotRepository) {
    this.parkingSpots = parkingSpots;
  }

  async execute(input: UpdateParkingSpotMetadataRequest): Promise<ParkingSpot> {
    const {
      parkingSpotId: parkingSpotIdInput,
      floor,
      row,
      column,
      isCovered,
      spotType,
    } = input.props;

    const spotId = UniqueIdentifier.fromExisting(parkingSpotIdInput);
    const spot = await this.parkingSpots.findById(spotId);

    if (!spot) {
      throw new ParkingSpotNotFoundError(parkingSpotIdInput);
    }

    const positionChanged =
      spot.floor() !== floor || spot.row() !== row || spot.column() !== column;

    if (positionChanged) {
      const collision = await this.parkingSpots.findByPosition({
        parkingLotId: spot.parkingLotId(),
        floor,
        row,
        column,
      });
      if (collision && !collision.id().equals(spot.id())) {
        throw new DuplicateSpotPositionError(spot.parkingLotId().value(), floor, row, column);
      }
    }

    spot.updateMetadata({
      floor,
      row,
      column,
      isCovered,
      spotType: SpotTypeVO.fromExisting(spotType),
    });

    await this.parkingSpots.save(spot);

    return spot;
  }
}
