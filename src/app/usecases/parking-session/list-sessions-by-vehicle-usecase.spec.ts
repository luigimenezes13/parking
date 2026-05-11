import { beforeEach, describe, expect, it } from 'vitest';

import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { makeVehicle } from '@domain/parking/__tests__/factories/vehicle.factory.ts';
import { enterSession } from '@domain/parking/__tests__/factories/parking-session.factory.ts';
import { InMemoryParkingSessionRepository } from '@app/tests/in-memory-repositories/in-memory-parking-session-repository.ts';
import { InMemoryVehicleRepository } from '@app/tests/in-memory-repositories/in-memory-vehicle-repository.ts';
import { ListSessionsByVehicleUseCase } from '@app/usecases/parking-session/list-sessions-by-vehicle-usecase.ts';
import { VehicleNotFoundError } from '@app/exceptions/vehicle/vehicle-not-found-error.ts';

interface Setup {
  sessions: InMemoryParkingSessionRepository;
  vehicles: InMemoryVehicleRepository;
  usecase: ListSessionsByVehicleUseCase;
}

async function makeSetup(): Promise<Setup> {
  const sessions = new InMemoryParkingSessionRepository();
  const vehicles = new InMemoryVehicleRepository();
  const usecase = new ListSessionsByVehicleUseCase(sessions, vehicles);
  return { sessions, vehicles, usecase };
}

describe('ListSessionsByVehicleUseCase', () => {
  let setup: Setup;

  beforeEach(async () => {
    setup = await makeSetup();
  });

  it('returns all sessions for the vehicle ordered by entryAt descending', async () => {
    const parkingLotId = UniqueIdentifier.create();
    const vehicle = makeVehicle({ parkingLotId });
    await setup.vehicles.save(vehicle);

    const earlier = enterSession({
      parkingLotId,
      vehicle,
      entryAt: new Date('2026-04-29T10:00:00Z'),
    });
    earlier.finish({ exitAt: new Date('2026-04-29T11:00:00Z') });

    const recent = enterSession({
      parkingLotId,
      vehicle,
      entryAt: new Date('2026-04-30T10:00:00Z'),
    });

    await setup.sessions.save(earlier);
    await setup.sessions.save(recent);

    const found = await setup.usecase.execute({ vehicleId: vehicle.id().value() });

    expect(found).toHaveLength(2);
    expect(found[0]?.id().equals(recent.id())).toBe(true);
    expect(found[1]?.id().equals(earlier.id())).toBe(true);
  });

  it('throws VehicleNotFoundError when vehicle is missing', async () => {
    await expect(
      setup.usecase.execute({ vehicleId: '00000000-0000-4000-8000-000000000000' }),
    ).rejects.toBeInstanceOf(VehicleNotFoundError);
  });
});
