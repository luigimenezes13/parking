import { inject, injectable } from 'inversify';

import { type UseCase } from '@app/shared/use-case.ts';
import { TYPES } from '@app/dto/types.ts';
import { UpdateParkingLotInfoRequest } from '@app/dto/inputs/parking-lot/update-parking-lot-info-input.ts';
import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { type ParkingLot } from '@domain/parking/entities/parking-lot.ts';
import { type ParkingLotRepository } from '@domain/parking/repositories/parking-lot-repository.ts';
import { ParkingLotNotFoundError } from '@app/exceptions/parking-lot/parking-lot-not-found-error.ts';

@injectable()
export class UpdateParkingLotInfoUseCase
  implements UseCase<UpdateParkingLotInfoRequest, ParkingLot>
{
  private readonly parkingLots: ParkingLotRepository;

  constructor(@inject(TYPES.ParkingLotRepository) parkingLots: ParkingLotRepository) {
    this.parkingLots = parkingLots;
  }

  async execute(input: UpdateParkingLotInfoRequest): Promise<ParkingLot> {
    const { parkingLotId, name, address, totalCapacity } = input.props;

    const parkingLot = await this.parkingLots.findById(
      UniqueIdentifier.fromExisting(parkingLotId),
    );

    if (!parkingLot) {
      throw new ParkingLotNotFoundError(parkingLotId);
    }

    parkingLot.updateInfo({ name, address, totalCapacity });
    await this.parkingLots.save(parkingLot);

    return parkingLot;
  }
}
