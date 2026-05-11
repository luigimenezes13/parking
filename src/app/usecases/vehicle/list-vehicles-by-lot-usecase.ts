import { inject, injectable } from 'inversify';

import { type UseCase } from '@app/shared/use-case.ts';
import { TYPES } from '@app/dto/types.ts';
import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { type Vehicle } from '@domain/parking/entities/vehicle.ts';
import { type ParkingLotRepository } from '@domain/parking/repositories/parking-lot-repository.ts';
import { type VehicleRepository } from '@domain/parking/repositories/vehicle-repository.ts';
import { ParkingLotNotFoundError } from '@app/exceptions/parking-lot/parking-lot-not-found-error.ts';

export interface ListVehiclesByLotInput {
  parkingLotId: string;
}

@injectable()
export class ListVehiclesByLotUseCase implements UseCase<ListVehiclesByLotInput, Vehicle[]> {
  private readonly vehicles: VehicleRepository;
  private readonly parkingLots: ParkingLotRepository;

  constructor(
    @inject(TYPES.VehicleRepository) vehicles: VehicleRepository,
    @inject(TYPES.ParkingLotRepository) parkingLots: ParkingLotRepository,
  ) {
    this.vehicles = vehicles;
    this.parkingLots = parkingLots;
  }

  async execute(input: ListVehiclesByLotInput): Promise<Vehicle[]> {
    const parkingLotId = UniqueIdentifier.fromExisting(input.parkingLotId);
    const parkingLot = await this.parkingLots.findById(parkingLotId);
    if (!parkingLot) {
      throw new ParkingLotNotFoundError(input.parkingLotId);
    }

    return this.vehicles.findByParkingLotId(parkingLotId);
  }
}
