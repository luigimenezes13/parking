import { inject, injectable } from 'inversify';

import { type UseCase } from '@app/shared/use-case.ts';
import { TYPES } from '@app/dto/types.ts';
import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { type Vehicle } from '@domain/parking/entities/vehicle.ts';
import { type DriverRepository } from '@domain/parking/repositories/driver-repository.ts';
import { type VehicleRepository } from '@domain/parking/repositories/vehicle-repository.ts';
import { VehicleNotFoundError } from '@app/exceptions/vehicle/vehicle-not-found-error.ts';
import { DriverNotFoundError } from '@app/exceptions/driver/driver-not-found-error.ts';

export interface TransferVehicleOwnershipInput {
  vehicleId: string;
  newDriverId: string;
}

@injectable()
export class TransferVehicleOwnershipUseCase implements UseCase<
  TransferVehicleOwnershipInput,
  Vehicle
> {
  private readonly vehicles: VehicleRepository;
  private readonly drivers: DriverRepository;

  constructor(
    @inject(TYPES.VehicleRepository) vehicles: VehicleRepository,
    @inject(TYPES.DriverRepository) drivers: DriverRepository,
  ) {
    this.vehicles = vehicles;
    this.drivers = drivers;
  }

  async execute(input: TransferVehicleOwnershipInput): Promise<Vehicle> {
    const vehicle = await this.vehicles.findById(UniqueIdentifier.fromExisting(input.vehicleId));
    if (!vehicle) {
      throw new VehicleNotFoundError(input.vehicleId);
    }

    const newDriverId = UniqueIdentifier.fromExisting(input.newDriverId);
    const newDriver = await this.drivers.findById(newDriverId);
    if (!newDriver || newDriver.isDeactivated()) {
      throw new DriverNotFoundError(input.newDriverId);
    }

    vehicle.transferOwnershipTo(newDriverId);
    await this.vehicles.save(vehicle);

    return vehicle;
  }
}
