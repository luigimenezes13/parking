import { beforeEach, describe, expect, it } from 'vitest';

import { InMemoryVehicleRepository } from '@app/tests/in-memory-repositories/in-memory-vehicle-repository.ts';
import { GetVehicleByIdUseCase } from '@app/usecases/vehicle/get-vehicle-by-id-usecase.ts';
import { VehicleNotFoundError } from '@app/exceptions/vehicle/vehicle-not-found-error.ts';
import { makeVehicle } from '@domain/parking/__tests__/factories/vehicle.factory.ts';

interface Setup {
  vehicles: InMemoryVehicleRepository;
  usecase: GetVehicleByIdUseCase;
}

async function makeSetup(): Promise<Setup> {
  const vehicles = new InMemoryVehicleRepository();
  const usecase = new GetVehicleByIdUseCase(vehicles);
  return { vehicles, usecase };
}

describe('GetVehicleByIdUseCase', () => {
  let setup: Setup;

  beforeEach(async () => {
    setup = await makeSetup();
  });

  it('returns the vehicle when found', async () => {
    const vehicle = makeVehicle();
    await setup.vehicles.save(vehicle);

    const found = await setup.usecase.execute({ vehicleId: vehicle.id().value() });

    expect(found.id().equals(vehicle.id())).toBe(true);
  });

  it('throws VehicleNotFoundError when missing', async () => {
    await expect(
      setup.usecase.execute({ vehicleId: '00000000-0000-4000-8000-000000000000' }),
    ).rejects.toBeInstanceOf(VehicleNotFoundError);
  });
});
