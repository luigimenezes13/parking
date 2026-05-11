import { inject, injectable } from 'inversify';

import { type UseCase } from '@app/shared/use-case.ts';
import { TYPES } from '@app/dto/types.ts';
import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { SpotCodeVO } from '@domain/parking/value-objects/spot-code-vo.ts';
import { SpotTypeVO } from '@domain/parking/value-objects/spot-type-vo.ts';
import { ParkingSpot } from '@domain/parking/entities/parking-spot.ts';
import { type ParkingLotRepository } from '@domain/parking/repositories/parking-lot-repository.ts';
import { type ParkingSpotRepository } from '@domain/parking/repositories/parking-spot-repository.ts';
import { ParkingLotNotFoundError } from '@app/exceptions/parking-lot/parking-lot-not-found-error.ts';
import { DuplicateSpotCodeError } from '@app/exceptions/parking-spot/duplicate-spot-code-error.ts';
import { DuplicateSpotPositionError } from '@app/exceptions/parking-spot/duplicate-spot-position-error.ts';

export interface CreateParkingSpotInput {
  parkingLotId: string;
  code: string;
  floor: number;
  row: number;
  column: number;
  isCovered: boolean;
  spotType: 'REGULAR' | 'COMPACT' | 'LARGE' | 'MOTORCYCLE' | 'ACCESSIBLE' | 'ELECTRIC';
}

export interface CreateParkingSpotOutput {
  parkingSpotId: string;
}

@injectable()
export class CreateParkingSpotUseCase implements UseCase<
  CreateParkingSpotInput,
  CreateParkingSpotOutput
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

  async execute(input: CreateParkingSpotInput): Promise<CreateParkingSpotOutput> {
    const parkingLotId = UniqueIdentifier.fromExisting(input.parkingLotId);
    const parkingLot = await this.parkingLots.findById(parkingLotId);
    if (!parkingLot || parkingLot.isDeactivated()) {
      throw new ParkingLotNotFoundError(input.parkingLotId);
    }

    const code = SpotCodeVO.from(input.code);
    const existingByCode = await this.parkingSpots.findByCode(parkingLotId, code);
    if (existingByCode) {
      throw new DuplicateSpotCodeError(input.parkingLotId, code.value());
    }

    const existingByPosition = await this.parkingSpots.findByPosition({
      parkingLotId,
      floor: input.floor,
      row: input.row,
      column: input.column,
    });
    if (existingByPosition) {
      throw new DuplicateSpotPositionError(
        input.parkingLotId,
        input.floor,
        input.row,
        input.column,
      );
    }

    const spot = ParkingSpot.register({
      parkingLotId,
      code,
      floor: input.floor,
      row: input.row,
      column: input.column,
      isCovered: input.isCovered,
      spotType: SpotTypeVO.fromExisting(input.spotType),
    });

    await this.parkingSpots.save(spot);

    return { parkingSpotId: spot.id().value() };
  }
}
