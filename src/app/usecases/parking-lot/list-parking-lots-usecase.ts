import { inject, injectable } from 'inversify';

import { type UseCase } from '@app/shared/use-case.ts';
import { TYPES } from '@app/dto/types.ts';
import { type ParkingLot } from '@domain/parking/entities/parking-lot.ts';
import { type ParkingLotRepository } from '@domain/parking/repositories/parking-lot-repository.ts';

export type ListParkingLotsInput = Record<string, never>;

@injectable()
export class ListParkingLotsUseCase implements UseCase<ListParkingLotsInput, ParkingLot[]> {
  private readonly parkingLots: ParkingLotRepository;

  constructor(@inject(TYPES.ParkingLotRepository) parkingLots: ParkingLotRepository) {
    this.parkingLots = parkingLots;
  }

  async execute(_input: ListParkingLotsInput): Promise<ParkingLot[]> {
    return this.parkingLots.findAll();
  }
}
