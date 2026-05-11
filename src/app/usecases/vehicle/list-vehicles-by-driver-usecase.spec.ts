import { beforeEach, describe, expect, it } from 'vitest';

import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { Driver } from '@domain/parking/entities/driver.ts';
import { Vehicle } from '@domain/parking/entities/vehicle.ts';
import { LicensePlateVO } from '@domain/parking/value-objects/license-plate-vo.ts';
import { InMemoryDriverRepository } from '@app/tests/in-memory-repositories/in-memory-driver-repository.ts';
import { InMemoryVehicleRepository } from '@app/tests/in-memory-repositories/in-memory-vehicle-repository.ts';
import { ListVehiclesByDriverUseCase } from '@app/usecases/vehicle/list-vehicles-by-driver-usecase.ts';
import { DriverNotFoundError } from '@app/exceptions/driver/driver-not-found-error.ts';

describe('ListVehiclesByDriverUseCase', () => {
  let drivers: InMemoryDriverRepository;
  let vehicles: InMemoryVehicleRepository;
  let usecase: ListVehiclesByDriverUseCase;

  beforeEach(() => {
    drivers = new InMemoryDriverRepository();
    vehicles = new InMemoryVehicleRepository();
    usecase = new ListVehiclesByDriverUseCase(vehicles, drivers);
  });

  it('returns all vehicles for the driver', async () => {
    const driver = Driver.register({
      cnh: '11111111111',
      name: 'Maria',
      email: 'maria@example.com',
      phone: '+5511999999999',
    });
    await drivers.save(driver);

    const lot = UniqueIdentifier.create();
    await vehicles.save(
      Vehicle.register({
        driverId: driver.id(),
        parkingLotId: lot,
        licensePlate: LicensePlateVO.from('AAA1A11'),
        brand: null,
        model: null,
        color: null,
      }),
    );
    await vehicles.save(
      Vehicle.register({
        driverId: driver.id(),
        parkingLotId: lot,
        licensePlate: LicensePlateVO.from('BBB2B22'),
        brand: null,
        model: null,
        color: null,
      }),
    );

    const found = await usecase.execute({ driverId: driver.id().value() });

    expect(found).toHaveLength(2);
  });

  it('throws DriverNotFoundError when driver does not exist', async () => {
    await expect(
      usecase.execute({ driverId: '00000000-0000-4000-8000-000000000000' }),
    ).rejects.toBeInstanceOf(DriverNotFoundError);
  });
});
