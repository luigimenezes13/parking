import { beforeEach, describe, expect, it } from 'vitest';

import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { InMemoryDriverRepository } from '@app/tests/in-memory-repositories/in-memory-driver-repository.ts';
import { InMemoryVehicleRepository } from '@app/tests/in-memory-repositories/in-memory-vehicle-repository.ts';
import { ListVehiclesByDriverUseCase } from '@app/usecases/vehicle/list-vehicles-by-driver-usecase.ts';
import { DriverNotFoundError } from '@app/exceptions/driver/driver-not-found-error.ts';
import { makeDriver } from '@domain/parking/__tests__/factories/driver.factory.ts';
import { makeVehicle } from '@domain/parking/__tests__/factories/vehicle.factory.ts';

interface Setup {
  drivers: InMemoryDriverRepository;
  vehicles: InMemoryVehicleRepository;
  usecase: ListVehiclesByDriverUseCase;
}

async function makeSetup(): Promise<Setup> {
  const drivers = new InMemoryDriverRepository();
  const vehicles = new InMemoryVehicleRepository();
  const usecase = new ListVehiclesByDriverUseCase(vehicles, drivers);
  return { drivers, vehicles, usecase };
}

describe('ListVehiclesByDriverUseCase', () => {
  let setup: Setup;

  beforeEach(async () => {
    setup = await makeSetup();
  });

  it('returns all vehicles for the driver', async () => {
    const driver = makeDriver();
    await setup.drivers.save(driver);

    const lot = UniqueIdentifier.create();
    await setup.vehicles.save(
      makeVehicle({ driverId: driver.id(), parkingLotId: lot, licensePlate: 'AAA1A11' }),
    );
    await setup.vehicles.save(
      makeVehicle({ driverId: driver.id(), parkingLotId: lot, licensePlate: 'BBB2B22' }),
    );

    const found = await setup.usecase.execute({ driverId: driver.id().value() });

    expect(found).toHaveLength(2);
  });

  it('throws DriverNotFoundError when driver does not exist', async () => {
    await expect(
      setup.usecase.execute({ driverId: '00000000-0000-4000-8000-000000000000' }),
    ).rejects.toBeInstanceOf(DriverNotFoundError);
  });
});
