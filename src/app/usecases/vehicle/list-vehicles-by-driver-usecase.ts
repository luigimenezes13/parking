import { inject, injectable } from 'inversify';

import { type UseCase } from '@app/shared/use-case.ts';
import { TYPES } from '@app/dto/types.ts';
import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { type Vehicle } from '@domain/parking/entities/vehicle.ts';
import { type DriverRepository } from '@domain/parking/repositories/driver-repository.ts';
import { type VehicleRepository } from '@domain/parking/repositories/vehicle-repository.ts';
import { DriverNotFoundError } from '@app/exceptions/driver/driver-not-found-error.ts';

export interface ListVehiclesByDriverInput {
  driverId: string;
}

@injectable()
export class ListVehiclesByDriverUseCase implements UseCase<ListVehiclesByDriverInput, Vehicle[]> {
  private readonly vehicles: VehicleRepository;
  private readonly drivers: DriverRepository;

  constructor(
    @inject(TYPES.VehicleRepository) vehicles: VehicleRepository,
    @inject(TYPES.DriverRepository) drivers: DriverRepository,
  ) {
    this.vehicles = vehicles;
    this.drivers = drivers;
  }

  async execute(input: ListVehiclesByDriverInput): Promise<Vehicle[]> {
    const driverId = UniqueIdentifier.fromExisting(input.driverId);
    const driver = await this.drivers.findById(driverId);
    if (!driver) {
      throw new DriverNotFoundError(input.driverId);
    }

    return this.vehicles.findByDriverId(driverId);
  }
}
