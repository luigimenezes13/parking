import { beforeEach, describe, expect, it } from 'vitest';

import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { Driver } from '@domain/parking/entities/driver.ts';
import { Vehicle } from '@domain/parking/entities/vehicle.ts';
import { LicensePlateVO } from '@domain/parking/value-objects/license-plate-vo.ts';
import { InMemoryDriverRepository } from '@app/tests/in-memory-repositories/in-memory-driver-repository.ts';
import { InMemoryVehicleRepository } from '@app/tests/in-memory-repositories/in-memory-vehicle-repository.ts';
import { TransferVehicleOwnershipUseCase } from '@app/usecases/vehicle/transfer-vehicle-ownership-usecase.ts';
import { TransferVehicleOwnershipRequest } from '@app/dto/inputs/vehicle/transfer-vehicle-ownership-input.ts';
import { VehicleNotFoundError } from '@app/exceptions/vehicle/vehicle-not-found-error.ts';
import { DriverNotFoundError } from '@app/exceptions/driver/driver-not-found-error.ts';

describe('TransferVehicleOwnershipUseCase', () => {
  let drivers: InMemoryDriverRepository;
  let vehicles: InMemoryVehicleRepository;
  let usecase: TransferVehicleOwnershipUseCase;

  beforeEach(() => {
    drivers = new InMemoryDriverRepository();
    vehicles = new InMemoryVehicleRepository();
    usecase = new TransferVehicleOwnershipUseCase(vehicles, drivers);
  });

  it('transfers ownership to the new driver', async () => {
    const newDriver = Driver.register({
      cnh: '99999999999',
      name: 'New',
      email: 'new@example.com',
      phone: '+5511111111111',
    });
    await drivers.save(newDriver);

    const vehicle = Vehicle.registerAnonymous({
      parkingLotId: UniqueIdentifier.create(),
      licensePlate: LicensePlateVO.from('ABC1D23'),
    });
    await vehicles.save(vehicle);

    const updated = await usecase.execute(
      new TransferVehicleOwnershipRequest({
        vehicleId: vehicle.id().value(),
        newDriverId: newDriver.id().value(),
      }),
    );

    expect(updated.driverId()?.equals(newDriver.id())).toBe(true);
  });

  it('throws VehicleNotFoundError when vehicle is missing', async () => {
    await expect(
      usecase.execute(
        new TransferVehicleOwnershipRequest({
          vehicleId: '00000000-0000-4000-8000-000000000000',
          newDriverId: '00000000-0000-4000-8000-000000000001',
        }),
      ),
    ).rejects.toBeInstanceOf(VehicleNotFoundError);
  });

  it('throws DriverNotFoundError when new driver is missing or deactivated', async () => {
    const vehicle = Vehicle.registerAnonymous({
      parkingLotId: UniqueIdentifier.create(),
      licensePlate: LicensePlateVO.from('ABC1D23'),
    });
    await vehicles.save(vehicle);

    await expect(
      usecase.execute(
        new TransferVehicleOwnershipRequest({
          vehicleId: vehicle.id().value(),
          newDriverId: '00000000-0000-4000-8000-000000000000',
        }),
      ),
    ).rejects.toBeInstanceOf(DriverNotFoundError);
  });
});
