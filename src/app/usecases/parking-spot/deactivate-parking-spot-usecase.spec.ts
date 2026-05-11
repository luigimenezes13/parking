import { beforeEach, describe, expect, it } from 'vitest';

import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { makeParkingSpot } from '@domain/parking/__tests__/factories/parking-spot.factory.ts';
import { makeVehicle } from '@domain/parking/__tests__/factories/vehicle.factory.ts';
import { enterSession } from '@domain/parking/__tests__/factories/parking-session.factory.ts';
import { EntityAlreadyDeactivatedError } from '@domain/parking/errors/entity-already-deactivated.ts';
import { InMemoryParkingSpotRepository } from '@app/tests/in-memory-repositories/in-memory-parking-spot-repository.ts';
import { InMemoryParkingSessionRepository } from '@app/tests/in-memory-repositories/in-memory-parking-session-repository.ts';
import { DeactivateParkingSpotUseCase } from '@app/usecases/parking-spot/deactivate-parking-spot-usecase.ts';
import { ParkingSpotNotFoundError } from '@app/exceptions/parking-spot/parking-spot-not-found-error.ts';
import { SpotHasActiveSessionError } from '@app/exceptions/parking-spot/spot-has-active-session-error.ts';

interface Setup {
  spots: InMemoryParkingSpotRepository;
  sessions: InMemoryParkingSessionRepository;
  usecase: DeactivateParkingSpotUseCase;
}

async function makeSetup(): Promise<Setup> {
  const spots = new InMemoryParkingSpotRepository();
  const sessions = new InMemoryParkingSessionRepository();
  const usecase = new DeactivateParkingSpotUseCase(spots, sessions);
  return { spots, sessions, usecase };
}

describe('DeactivateParkingSpotUseCase', () => {
  let setup: Setup;

  beforeEach(async () => {
    setup = await makeSetup();
  });

  it('marks the spot as deactivated when there are no active sessions', async () => {
    const spot = makeParkingSpot({ code: 'A1' });
    await setup.spots.save(spot);

    const deactivated = await setup.usecase.execute({ parkingSpotId: spot.id().value() });

    expect(deactivated.isDeactivated()).toBe(true);
  });

  it('throws ParkingSpotNotFoundError when missing', async () => {
    await expect(
      setup.usecase.execute({ parkingSpotId: '00000000-0000-4000-8000-000000000000' }),
    ).rejects.toBeInstanceOf(ParkingSpotNotFoundError);
  });

  it('throws SpotHasActiveSessionError when an active session uses the spot', async () => {
    const parkingLotId = UniqueIdentifier.create();
    const spot = makeParkingSpot({ parkingLotId, code: 'A1' });
    await setup.spots.save(spot);

    const vehicle = makeVehicle({ parkingLotId });

    const session = enterSession({ parkingLotId, vehicle });
    session.assignSpot({ spot, occupiedAt: new Date('2026-04-30T10:01:00Z') });
    await setup.sessions.save(session);

    await expect(
      setup.usecase.execute({ parkingSpotId: spot.id().value() }),
    ).rejects.toBeInstanceOf(SpotHasActiveSessionError);
  });

  it('throws EntityAlreadyDeactivatedError when already deactivated', async () => {
    const spot = makeParkingSpot({ code: 'A1' });
    spot.deactivate(new Date());
    await setup.spots.save(spot);

    await expect(
      setup.usecase.execute({ parkingSpotId: spot.id().value() }),
    ).rejects.toBeInstanceOf(EntityAlreadyDeactivatedError);
  });
});
