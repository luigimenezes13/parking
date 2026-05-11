import { inject, injectable } from 'inversify';

import { type UseCase } from '@app/shared/use-case.ts';
import { TYPES } from '@app/dto/types.ts';
import { type CreateParkingLotRequest } from '@app/dto/inputs/parking-lot/create-parking-lot-input.ts';
import { ParkingLot } from '@domain/parking/entities/parking-lot.ts';
import { type ParkingLotRepository } from '@domain/parking/repositories/parking-lot-repository.ts';

export interface CreateParkingLotOutput {
  parkingLotId: string;
}

@injectable()
export class CreateParkingLotUseCase implements UseCase<
  CreateParkingLotRequest,
  CreateParkingLotOutput
> {
  private readonly parkingLots: ParkingLotRepository;

  constructor(@inject(TYPES.ParkingLotRepository) parkingLots: ParkingLotRepository) {
    this.parkingLots = parkingLots;
  }

  async execute(input: CreateParkingLotRequest): Promise<CreateParkingLotOutput> {
    const { name, address, totalCapacity } = input.props;

    const parkingLot = ParkingLot.register({ name, address, totalCapacity });

    await this.parkingLots.save(parkingLot);

    return { parkingLotId: parkingLot.id().value() };
  }
}
