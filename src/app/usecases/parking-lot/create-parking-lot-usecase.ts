import { inject, injectable } from 'inversify';

import { type UseCase } from '@app/shared/use-case.ts';
import { TYPES } from '@app/dto/types.ts';
import { ParkingLot } from '@domain/parking/entities/parking-lot.ts';
import { type ParkingLotRepository } from '@domain/parking/repositories/parking-lot-repository.ts';

export interface CreateParkingLotInput {
  name: string;
  address: string;
  totalCapacity: number;
}

export interface CreateParkingLotOutput {
  parkingLotId: string;
}

@injectable()
export class CreateParkingLotUseCase implements UseCase<
  CreateParkingLotInput,
  CreateParkingLotOutput
> {
  private readonly parkingLots: ParkingLotRepository;

  constructor(@inject(TYPES.ParkingLotRepository) parkingLots: ParkingLotRepository) {
    this.parkingLots = parkingLots;
  }

  async execute(input: CreateParkingLotInput): Promise<CreateParkingLotOutput> {
    const parkingLot = ParkingLot.register({
      name: input.name,
      address: input.address,
      totalCapacity: input.totalCapacity,
    });

    await this.parkingLots.save(parkingLot);

    return { parkingLotId: parkingLot.id().value() };
  }
}
