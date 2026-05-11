import { beforeEach, describe, expect, it } from 'vitest';

import { InMemoryVehicleRepository } from '@app/tests/in-memory-repositories/in-memory-vehicle-repository.ts';
import { UpdateVehicleAppearanceUseCase } from '@app/usecases/vehicle/update-vehicle-appearance-usecase.ts';
import { UpdateVehicleAppearanceRequest } from '@app/dto/inputs/vehicle/update-vehicle-appearance-input.ts';
import { VehicleNotFoundError } from '@app/exceptions/vehicle/vehicle-not-found-error.ts';
import { makeVehicle } from '@domain/parking/__tests__/factories/vehicle.factory.ts';

interface Setup {
  vehicles: InMemoryVehicleRepository;
  usecase: UpdateVehicleAppearanceUseCase;
}

async function makeSetup(): Promise<Setup> {
  const vehicles = new InMemoryVehicleRepository();
  const usecase = new UpdateVehicleAppearanceUseCase(vehicles);
  return { vehicles, usecase };
}

describe('UpdateVehicleAppearanceUseCase', () => {
  let setup: Setup;

  beforeEach(async () => {
    setup = await makeSetup();
  });

  it('updates brand, model and color', async () => {
    const vehicle = makeVehicle({ brand: 'Old', model: 'OldModel', color: 'OldColor' });
    await setup.vehicles.save(vehicle);

    const updated = await setup.usecase.execute(
      new UpdateVehicleAppearanceRequest({
        vehicleId: vehicle.id().value(),
        brand: 'Toyota',
        model: 'Corolla',
        color: 'prata',
      }),
    );

    expect(updated.brand()).toBe('Toyota');
    expect(updated.model()).toBe('Corolla');
    expect(updated.color()).toBe('prata');
  });

  it('throws VehicleNotFoundError when missing', async () => {
    await expect(
      setup.usecase.execute(
        new UpdateVehicleAppearanceRequest({
          vehicleId: '00000000-0000-4000-8000-000000000000',
          brand: 'X',
          model: 'Y',
          color: 'Z',
        }),
      ),
    ).rejects.toBeInstanceOf(VehicleNotFoundError);
  });
});
