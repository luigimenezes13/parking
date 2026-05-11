import { beforeEach, describe, expect, it } from 'vitest';

import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { Vehicle } from '@domain/parking/entities/vehicle.ts';
import { LicensePlateVO } from '@domain/parking/value-objects/license-plate-vo.ts';
import { InMemoryVehicleRepository } from '@app/tests/in-memory-repositories/in-memory-vehicle-repository.ts';
import { GetVehicleByIdUseCase } from '@app/usecases/vehicle/get-vehicle-by-id-usecase.ts';
import { VehicleNotFoundError } from '@app/exceptions/vehicle/vehicle-not-found-error.ts';

describe('GetVehicleByIdUseCase', () => {
  let vehicles: InMemoryVehicleRepository;
  let usecase: GetVehicleByIdUseCase;

  beforeEach(() => {
    vehicles = new InMemoryVehicleRepository();
    usecase = new GetVehicleByIdUseCase(vehicles);
  });

  it('returns the vehicle when found', async () => {
    const vehicle = Vehicle.registerAnonymous({
      parkingLotId: UniqueIdentifier.create(),
      licensePlate: LicensePlateVO.from('ABC1D23'),
    });
    await vehicles.save(vehicle);

    const found = await usecase.execute({ vehicleId: vehicle.id().value() });

    expect(found.id().equals(vehicle.id())).toBe(true);
  });

  it('throws VehicleNotFoundError when missing', async () => {
    await expect(
      usecase.execute({ vehicleId: '00000000-0000-4000-8000-000000000000' }),
    ).rejects.toBeInstanceOf(VehicleNotFoundError);
  });
});
