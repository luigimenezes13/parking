import { beforeEach, describe, expect, it } from 'vitest';

import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { Vehicle } from '@domain/parking/entities/vehicle.ts';
import { LicensePlateVO } from '@domain/parking/value-objects/license-plate-vo.ts';
import { makeParkingSpot } from '@domain/parking/__tests__/factories/parking-spot.factory.ts';
import { ParkingSession } from '@domain/parking/aggregates/parking-session/parking-session.ts';
import { EntityAlreadyDeactivatedError } from '@domain/parking/errors/entity-already-deactivated.ts';
import { InMemoryParkingSpotRepository } from '@app/tests/in-memory-repositories/in-memory-parking-spot-repository.ts';
import { InMemoryParkingSessionRepository } from '@app/tests/in-memory-repositories/in-memory-parking-session-repository.ts';
import { DeactivateParkingSpotUseCase } from '@app/usecases/parking-spot/deactivate-parking-spot-usecase.ts';
import { ParkingSpotNotFoundError } from '@app/exceptions/parking-spot/parking-spot-not-found-error.ts';
import { SpotHasActiveSessionError } from '@app/exceptions/parking-spot/spot-has-active-session-error.ts';

describe('DeactivateParkingSpotUseCase', () => {
  let spots: InMemoryParkingSpotRepository;
  let sessions: InMemoryParkingSessionRepository;
  let usecase: DeactivateParkingSpotUseCase;

  beforeEach(() => {
    spots = new InMemoryParkingSpotRepository();
    sessions = new InMemoryParkingSessionRepository();
    usecase = new DeactivateParkingSpotUseCase(spots, sessions);
  });

  it('marks the spot as deactivated when there are no active sessions', async () => {
    const spot = makeParkingSpot({ code: 'A1' });
    await spots.save(spot);

    const deactivated = await usecase.execute({ parkingSpotId: spot.id().value() });

    expect(deactivated.isDeactivated()).toBe(true);
  });

  it('throws ParkingSpotNotFoundError when missing', async () => {
    await expect(
      usecase.execute({ parkingSpotId: '00000000-0000-4000-8000-000000000000' }),
    ).rejects.toBeInstanceOf(ParkingSpotNotFoundError);
  });

  it('throws SpotHasActiveSessionError when an active session uses the spot', async () => {
    const parkingLotId = UniqueIdentifier.create();
    const spot = makeParkingSpot({ parkingLotId, code: 'A1' });
    await spots.save(spot);

    const vehicle = Vehicle.registerAnonymous({
      parkingLotId,
      licensePlate: LicensePlateVO.from('ABC1D23'),
    });

    const session = ParkingSession.enter({
      parkingLotId,
      vehicle,
      entryAt: new Date('2026-04-30T10:00:00Z'),
    });
    session.assignSpot({ spot, occupiedAt: new Date('2026-04-30T10:01:00Z') });
    await sessions.save(session);

    await expect(usecase.execute({ parkingSpotId: spot.id().value() })).rejects.toBeInstanceOf(
      SpotHasActiveSessionError,
    );
  });

  it('throws EntityAlreadyDeactivatedError when already deactivated', async () => {
    const spot = makeParkingSpot({ code: 'A1' });
    spot.deactivate(new Date());
    await spots.save(spot);

    await expect(usecase.execute({ parkingSpotId: spot.id().value() })).rejects.toBeInstanceOf(
      EntityAlreadyDeactivatedError,
    );
  });
});
