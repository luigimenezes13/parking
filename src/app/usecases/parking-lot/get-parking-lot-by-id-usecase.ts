import { inject, injectable } from 'inversify';

import { type UseCase } from '@app/shared/use-case.ts';
import { TYPES } from '@app/dto/types.ts';
import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { type ParkingLot } from '@domain/parking/entities/parking-lot.ts';
import { type ParkingLotRepository } from '@domain/parking/repositories/parking-lot-repository.ts';
import { ParkingLotNotFoundError } from '@app/exceptions/parking-lot/parking-lot-not-found-error.ts';

export interface GetParkingLotByIdInput {
  parkingLotId: string;
}

@injectable()
export class GetParkingLotByIdUseCase implements UseCase<GetParkingLotByIdInput, ParkingLot> {
  private readonly parkingLots: ParkingLotRepository;

  constructor(@inject(TYPES.ParkingLotRepository) parkingLots: ParkingLotRepository) {
    this.parkingLots = parkingLots;
  }

  async execute(input: GetParkingLotByIdInput): Promise<ParkingLot> {
    const parkingLot = await this.parkingLots.findById(
      UniqueIdentifier.fromExisting(input.parkingLotId),
    );

    if (!parkingLot) {
      throw new ParkingLotNotFoundError(input.parkingLotId);
    }

    return parkingLot;
  }
}
