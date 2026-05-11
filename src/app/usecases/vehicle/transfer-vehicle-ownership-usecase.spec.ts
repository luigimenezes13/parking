import { beforeEach, describe, expect, it } from 'vitest';

import { InMemoryDriverRepository } from '@app/tests/in-memory-repositories/in-memory-driver-repository.ts';
import { InMemoryVehicleRepository } from '@app/tests/in-memory-repositories/in-memory-vehicle-repository.ts';
import { TransferVehicleOwnershipUseCase } from '@app/usecases/vehicle/transfer-vehicle-ownership-usecase.ts';
import { TransferVehicleOwnershipRequest } from '@app/dto/inputs/vehicle/transfer-vehicle-ownership-input.ts';
import { VehicleNotFoundError } from '@app/exceptions/vehicle/vehicle-not-found-error.ts';
import { DriverNotFoundError } from '@app/exceptions/driver/driver-not-found-error.ts';
import { makeDriver } from '@domain/parking/__tests__/factories/driver.factory.ts';
import { makeVehicle } from '@domain/parking/__tests__/factories/vehicle.factory.ts';

interface Setup {
  drivers: InMemoryDriverRepository;
  vehicles: InMemoryVehicleRepository;
  usecase: TransferVehicleOwnershipUseCase;
}

async function makeSetup(): Promise<Setup> {
  const drivers = new InMemoryDriverRepository();
  const vehicles = new InMemoryVehicleRepository();
  const usecase = new TransferVehicleOwnershipUseCase(vehicles, drivers);
  return { drivers, vehicles, usecase };
}

describe('TransferVehicleOwnershipUseCase', () => {
  let setup: Setup;

  beforeEach(async () => {
    setup = await makeSetup();
  });

  it('transfers ownership to the new driver', async () => {
    const newDriver = makeDriver({ cnh: '99999999999', name: 'New', email: 'new@example.com' });
    await setup.drivers.save(newDriver);

    const vehicle = makeVehicle();
    await setup.vehicles.save(vehicle);

    const updated = await setup.usecase.execute(
      new TransferVehicleOwnershipRequest({
        vehicleId: vehicle.id().value(),
        newDriverId: newDriver.id().value(),
      }),
    );

    expect(updated.driverId()?.equals(newDriver.id())).toBe(true);
  });

  it('throws VehicleNotFoundError when vehicle is missing', async () => {
    await expect(
      setup.usecase.execute(
        new TransferVehicleOwnershipRequest({
          vehicleId: '00000000-0000-4000-8000-000000000000',
          newDriverId: '00000000-0000-4000-8000-000000000001',
        }),
      ),
    ).rejects.toBeInstanceOf(VehicleNotFoundError);
  });

  it('throws DriverNotFoundError when new driver is missing or deactivated', async () => {
    const vehicle = makeVehicle();
    await setup.vehicles.save(vehicle);

    await expect(
      setup.usecase.execute(
        new TransferVehicleOwnershipRequest({
          vehicleId: vehicle.id().value(),
          newDriverId: '00000000-0000-4000-8000-000000000000',
        }),
      ),
    ).rejects.toBeInstanceOf(DriverNotFoundError);
  });
});
