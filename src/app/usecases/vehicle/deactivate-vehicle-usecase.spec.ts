import { beforeEach, describe, expect, it } from 'vitest';

import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { EntityAlreadyDeactivatedError } from '@domain/parking/errors/entity-already-deactivated.ts';
import { InMemoryVehicleRepository } from '@app/tests/in-memory-repositories/in-memory-vehicle-repository.ts';
import { InMemoryParkingSessionRepository } from '@app/tests/in-memory-repositories/in-memory-parking-session-repository.ts';
import { DeactivateVehicleUseCase } from '@app/usecases/vehicle/deactivate-vehicle-usecase.ts';
import { VehicleNotFoundError } from '@app/exceptions/vehicle/vehicle-not-found-error.ts';
import { VehicleHasActiveSessionError } from '@app/exceptions/vehicle/vehicle-has-active-session-error.ts';
import { makeVehicle } from '@domain/parking/__tests__/factories/vehicle.factory.ts';
import { enterSession } from '@domain/parking/__tests__/factories/parking-session.factory.ts';

interface Setup {
  vehicles: InMemoryVehicleRepository;
  sessions: InMemoryParkingSessionRepository;
  usecase: DeactivateVehicleUseCase;
}

async function makeSetup(): Promise<Setup> {
  const vehicles = new InMemoryVehicleRepository();
  const sessions = new InMemoryParkingSessionRepository();
  const usecase = new DeactivateVehicleUseCase(vehicles, sessions);
  return { vehicles, sessions, usecase };
}

describe('DeactivateVehicleUseCase', () => {
  let setup: Setup;

  beforeEach(async () => {
    setup = await makeSetup();
  });

  it('marks the vehicle as deactivated when there is no active session', async () => {
    const vehicle = makeVehicle();
    await setup.vehicles.save(vehicle);

    const deactivated = await setup.usecase.execute({ vehicleId: vehicle.id().value() });

    expect(deactivated.isDeactivated()).toBe(true);
  });

  it('throws VehicleNotFoundError when missing', async () => {
    await expect(
      setup.usecase.execute({ vehicleId: '00000000-0000-4000-8000-000000000000' }),
    ).rejects.toBeInstanceOf(VehicleNotFoundError);
  });

  it('throws VehicleHasActiveSessionError when an active session exists for the plate', async () => {
    const parkingLotId = UniqueIdentifier.create();
    const vehicle = makeVehicle({ parkingLotId });
    await setup.vehicles.save(vehicle);

    const session = enterSession({ parkingLotId, vehicle });
    await setup.sessions.save(session);

    await expect(setup.usecase.execute({ vehicleId: vehicle.id().value() })).rejects.toBeInstanceOf(
      VehicleHasActiveSessionError,
    );
  });

  it('throws EntityAlreadyDeactivatedError when already deactivated', async () => {
    const vehicle = makeVehicle();
    vehicle.deactivate(new Date());
    await setup.vehicles.save(vehicle);

    await expect(setup.usecase.execute({ vehicleId: vehicle.id().value() })).rejects.toBeInstanceOf(
      EntityAlreadyDeactivatedError,
    );
  });
});
