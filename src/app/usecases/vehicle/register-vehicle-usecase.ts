import { inject, injectable } from 'inversify';

import { type UseCase } from '@app/shared/use-case.ts';
import { TYPES } from '@app/dto/types.ts';
import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { LicensePlateVO } from '@domain/parking/value-objects/license-plate-vo.ts';
import { Vehicle } from '@domain/parking/entities/vehicle.ts';
import { type DriverRepository } from '@domain/parking/repositories/driver-repository.ts';
import { type ParkingLotRepository } from '@domain/parking/repositories/parking-lot-repository.ts';
import { type VehicleRepository } from '@domain/parking/repositories/vehicle-repository.ts';
import { DriverNotFoundError } from '@app/exceptions/driver/driver-not-found-error.ts';
import { ParkingLotNotFoundError } from '@app/exceptions/parking-lot/parking-lot-not-found-error.ts';
import { DuplicateVehicleLicensePlateError } from '@app/exceptions/vehicle/duplicate-vehicle-license-plate-error.ts';

export interface RegisterVehicleInput {
  driverId?: string | null;
  parkingLotId: string;
  licensePlate: string;
  brand?: string | null;
  model?: string | null;
  color?: string | null;
}

export interface RegisterVehicleOutput {
  vehicleId: string;
}

@injectable()
export class RegisterVehicleUseCase implements UseCase<
  RegisterVehicleInput,
  RegisterVehicleOutput
> {
  private readonly vehicles: VehicleRepository;
  private readonly drivers: DriverRepository;
  private readonly parkingLots: ParkingLotRepository;

  constructor(
    @inject(TYPES.VehicleRepository) vehicles: VehicleRepository,
    @inject(TYPES.DriverRepository) drivers: DriverRepository,
    @inject(TYPES.ParkingLotRepository) parkingLots: ParkingLotRepository,
  ) {
    this.vehicles = vehicles;
    this.drivers = drivers;
    this.parkingLots = parkingLots;
  }

  async execute(input: RegisterVehicleInput): Promise<RegisterVehicleOutput> {
    const parkingLot = await this.parkingLots.findById(
      UniqueIdentifier.fromExisting(input.parkingLotId),
    );
    if (!parkingLot || parkingLot.isDeactivated()) {
      throw new ParkingLotNotFoundError(input.parkingLotId);
    }

    let driverId: UniqueIdentifier | null = null;
    if (input.driverId) {
      const driver = await this.drivers.findById(UniqueIdentifier.fromExisting(input.driverId));
      if (!driver || driver.isDeactivated()) {
        throw new DriverNotFoundError(input.driverId);
      }
      driverId = driver.id();
    }

    const licensePlate = LicensePlateVO.from(input.licensePlate);
    const existing = await this.vehicles.findByLicensePlate(licensePlate);
    if (existing) {
      throw new DuplicateVehicleLicensePlateError(licensePlate.value());
    }

    const vehicle = Vehicle.register({
      driverId,
      parkingLotId: parkingLot.id(),
      licensePlate,
      brand: input.brand ?? null,
      model: input.model ?? null,
      color: input.color ?? null,
    });

    await this.vehicles.save(vehicle);

    return { vehicleId: vehicle.id().value() };
  }
}
