import { beforeEach, describe, expect, it } from 'vitest';

import { Driver } from '@domain/parking/entities/driver.ts';
import { ParkingLot } from '@domain/parking/entities/parking-lot.ts';
import { Vehicle } from '@domain/parking/entities/vehicle.ts';
import { LicensePlateVO } from '@domain/parking/value-objects/license-plate-vo.ts';
import { InMemoryDriverRepository } from '@app/tests/in-memory-repositories/in-memory-driver-repository.ts';
import { InMemoryParkingLotRepository } from '@app/tests/in-memory-repositories/in-memory-parking-lot-repository.ts';
import { InMemoryVehicleRepository } from '@app/tests/in-memory-repositories/in-memory-vehicle-repository.ts';
import { RegisterVehicleUseCase } from '@app/usecases/vehicle/register-vehicle-usecase.ts';
import { ParkingLotNotFoundError } from '@app/exceptions/parking-lot/parking-lot-not-found-error.ts';
import { DriverNotFoundError } from '@app/exceptions/driver/driver-not-found-error.ts';
import { DuplicateVehicleLicensePlateError } from '@app/exceptions/vehicle/duplicate-vehicle-license-plate-error.ts';

interface Setup {
  vehicles: InMemoryVehicleRepository;
  drivers: InMemoryDriverRepository;
  parkingLots: InMemoryParkingLotRepository;
  usecase: RegisterVehicleUseCase;
  lot: ParkingLot;
  driver: Driver;
}

async function makeSetup(): Promise<Setup> {
  const vehicles = new InMemoryVehicleRepository();
  const drivers = new InMemoryDriverRepository();
  const parkingLots = new InMemoryParkingLotRepository();

  const lot = ParkingLot.register({ name: 'Lot', address: 'addr', totalCapacity: 50 });
  await parkingLots.save(lot);

  const driver = Driver.register({
    cnh: '11111111111',
    name: 'Maria',
    email: 'maria@example.com',
    phone: '+5511999999999',
  });
  await drivers.save(driver);

  const usecase = new RegisterVehicleUseCase(vehicles, drivers, parkingLots);

  return { vehicles, drivers, parkingLots, usecase, lot, driver };
}

describe('RegisterVehicleUseCase', () => {
  let setup: Setup;

  beforeEach(async () => {
    setup = await makeSetup();
  });

  it('persists a new vehicle with driver', async () => {
    const result = await setup.usecase.execute({
      driverId: setup.driver.id().value(),
      parkingLotId: setup.lot.id().value(),
      licensePlate: 'ABC1D23',
      brand: 'Toyota',
      model: 'Corolla',
      color: 'prata',
    });

    expect(result.vehicleId).toBeDefined();
    const stored = await setup.vehicles.findByLicensePlate(LicensePlateVO.from('ABC1D23'));
    expect(stored?.driverId()?.equals(setup.driver.id())).toBe(true);
  });

  it('allows registering without a driver (anonymous)', async () => {
    const result = await setup.usecase.execute({
      parkingLotId: setup.lot.id().value(),
      licensePlate: 'XYZ9K88',
    });

    const stored = await setup.vehicles.findByLicensePlate(LicensePlateVO.from('XYZ9K88'));
    expect(stored).not.toBeNull();
    expect(stored?.driverId()).toBeNull();
    expect(result.vehicleId).toBe(stored?.id().value());
  });

  it('throws ParkingLotNotFoundError when lot does not exist', async () => {
    await expect(
      setup.usecase.execute({
        parkingLotId: '00000000-0000-4000-8000-000000000000',
        licensePlate: 'ABC1D23',
      }),
    ).rejects.toBeInstanceOf(ParkingLotNotFoundError);
  });

  it('throws DriverNotFoundError when driver does not exist', async () => {
    await expect(
      setup.usecase.execute({
        parkingLotId: setup.lot.id().value(),
        driverId: '00000000-0000-4000-8000-000000000000',
        licensePlate: 'ABC1D23',
      }),
    ).rejects.toBeInstanceOf(DriverNotFoundError);
  });

  it('throws DuplicateVehicleLicensePlateError when plate already exists', async () => {
    await setup.vehicles.save(
      Vehicle.registerAnonymous({
        parkingLotId: setup.lot.id(),
        licensePlate: LicensePlateVO.from('ABC1D23'),
      }),
    );

    await expect(
      setup.usecase.execute({
        parkingLotId: setup.lot.id().value(),
        licensePlate: 'ABC1D23',
      }),
    ).rejects.toBeInstanceOf(DuplicateVehicleLicensePlateError);
  });
});
