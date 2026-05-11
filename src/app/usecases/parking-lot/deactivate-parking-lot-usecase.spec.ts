import { beforeEach, describe, expect, it } from 'vitest';

import { ParkingLot } from '@domain/parking/entities/parking-lot.ts';
import { ParkingSession } from '@domain/parking/aggregates/parking-session/parking-session.ts';
import { EntityAlreadyDeactivatedError } from '@domain/parking/errors/entity-already-deactivated.ts';
import { InMemoryParkingLotRepository } from '@app/tests/in-memory-repositories/in-memory-parking-lot-repository.ts';
import { InMemoryParkingSessionRepository } from '@app/tests/in-memory-repositories/in-memory-parking-session-repository.ts';
import { DeactivateParkingLotUseCase } from '@app/usecases/parking-lot/deactivate-parking-lot-usecase.ts';
import { ParkingLotNotFoundError } from '@app/exceptions/parking-lot/parking-lot-not-found-error.ts';
import { ParkingLotHasActiveSessionsError } from '@app/exceptions/parking-lot/parking-lot-has-active-sessions-error.ts';

describe('DeactivateParkingLotUseCase', () => {
  let parkingLots: InMemoryParkingLotRepository;
  let sessions: InMemoryParkingSessionRepository;
  let usecase: DeactivateParkingLotUseCase;

  beforeEach(() => {
    parkingLots = new InMemoryParkingLotRepository();
    sessions = new InMemoryParkingSessionRepository();
    usecase = new DeactivateParkingLotUseCase(parkingLots, sessions);
  });

  it('marks the parking lot as deactivated when there are no active sessions', async () => {
    const lot = ParkingLot.register({ name: 'Lot', address: 'addr', totalCapacity: 10 });
    await parkingLots.save(lot);

    const deactivated = await usecase.execute({ parkingLotId: lot.id().value() });

    expect(deactivated.isDeactivated()).toBe(true);
  });

  it('throws ParkingLotNotFoundError when missing', async () => {
    await expect(
      usecase.execute({ parkingLotId: '00000000-0000-4000-8000-000000000000' }),
    ).rejects.toBeInstanceOf(ParkingLotNotFoundError);
  });

  it('throws ParkingLotHasActiveSessionsError when there are active sessions', async () => {
    const lot = ParkingLot.register({ name: 'Lot', address: 'addr', totalCapacity: 10 });
    await parkingLots.save(lot);

    const session = ParkingSession.enter({
      parkingLotId: lot.id(),
      entryAt: new Date('2026-04-30T10:00:00Z'),
    });
    await sessions.save(session);

    await expect(usecase.execute({ parkingLotId: lot.id().value() })).rejects.toBeInstanceOf(
      ParkingLotHasActiveSessionsError,
    );
  });

  it('throws EntityAlreadyDeactivatedError when already deactivated', async () => {
    const lot = ParkingLot.register({ name: 'Lot', address: 'addr', totalCapacity: 10 });
    lot.deactivate(new Date());
    await parkingLots.save(lot);

    await expect(usecase.execute({ parkingLotId: lot.id().value() })).rejects.toBeInstanceOf(
      EntityAlreadyDeactivatedError,
    );
  });
});
