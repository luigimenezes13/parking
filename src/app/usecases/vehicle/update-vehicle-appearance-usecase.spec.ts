import { beforeEach, describe, expect, it } from 'vitest';

import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { Vehicle } from '@domain/parking/entities/vehicle.ts';
import { LicensePlateVO } from '@domain/parking/value-objects/license-plate-vo.ts';
import { InMemoryVehicleRepository } from '@app/tests/in-memory-repositories/in-memory-vehicle-repository.ts';
import { UpdateVehicleAppearanceUseCase } from '@app/usecases/vehicle/update-vehicle-appearance-usecase.ts';
import { VehicleNotFoundError } from '@app/exceptions/vehicle/vehicle-not-found-error.ts';

describe('UpdateVehicleAppearanceUseCase', () => {
  let vehicles: InMemoryVehicleRepository;
  let usecase: UpdateVehicleAppearanceUseCase;

  beforeEach(() => {
    vehicles = new InMemoryVehicleRepository();
    usecase = new UpdateVehicleAppearanceUseCase(vehicles);
  });

  it('updates brand, model and color', async () => {
    const vehicle = Vehicle.registerAnonymous({
      parkingLotId: UniqueIdentifier.create(),
      licensePlate: LicensePlateVO.from('ABC1D23'),
      brand: 'Old',
      model: 'OldModel',
      color: 'OldColor',
    });
    await vehicles.save(vehicle);

    const updated = await usecase.execute({
      vehicleId: vehicle.id().value(),
      brand: 'Toyota',
      model: 'Corolla',
      color: 'prata',
    });

    expect(updated.brand()).toBe('Toyota');
    expect(updated.model()).toBe('Corolla');
    expect(updated.color()).toBe('prata');
  });

  it('throws VehicleNotFoundError when missing', async () => {
    await expect(
      usecase.execute({
        vehicleId: '00000000-0000-4000-8000-000000000000',
        brand: 'X',
        model: 'Y',
        color: 'Z',
      }),
    ).rejects.toBeInstanceOf(VehicleNotFoundError);
  });
});
