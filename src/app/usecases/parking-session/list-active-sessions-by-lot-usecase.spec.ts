import { beforeEach, describe, expect, it } from 'vitest';

import { makeParkingLot } from '@domain/parking/__tests__/factories/parking-lot.factory.ts';
import { makeActiveSession } from '@domain/parking/__tests__/factories/parking-session.factory.ts';
import { InMemoryParkingLotRepository } from '@app/tests/in-memory-repositories/in-memory-parking-lot-repository.ts';
import { InMemoryParkingSessionRepository } from '@app/tests/in-memory-repositories/in-memory-parking-session-repository.ts';
import { ListActiveSessionsByLotUseCase } from '@app/usecases/parking-session/list-active-sessions-by-lot-usecase.ts';
import { ParkingLotNotFoundError } from '@app/exceptions/parking-lot/parking-lot-not-found-error.ts';

interface Setup {
  lots: InMemoryParkingLotRepository;
  sessions: InMemoryParkingSessionRepository;
  usecase: ListActiveSessionsByLotUseCase;
}

async function makeSetup(): Promise<Setup> {
  const lots = new InMemoryParkingLotRepository();
  const sessions = new InMemoryParkingSessionRepository();
  const usecase = new ListActiveSessionsByLotUseCase(sessions, lots);
  return { lots, sessions, usecase };
}

describe('ListActiveSessionsByLotUseCase', () => {
  let setup: Setup;

  beforeEach(async () => {
    setup = await makeSetup();
  });

  it('returns active sessions for the lot ordered by entryAt ascending', async () => {
    const lot = makeParkingLot({ name: 'Lot', address: 'a', totalCapacity: 10 });
    await setup.lots.save(lot);

    const earlier = makeActiveSession({
      parkingLotId: lot.id(),
      vehicle: null,
      entryAt: new Date('2026-04-30T09:00:00Z'),
    });
    const later = makeActiveSession({
      parkingLotId: lot.id(),
      vehicle: null,
      entryAt: new Date('2026-04-30T10:00:00Z'),
    });
    await setup.sessions.save(later);
    await setup.sessions.save(earlier);

    const found = await setup.usecase.execute({ parkingLotId: lot.id().value() });

    expect(found).toHaveLength(2);
    expect(found[0]?.id().equals(earlier.id())).toBe(true);
    expect(found[1]?.id().equals(later.id())).toBe(true);
  });

  it('throws ParkingLotNotFoundError when lot is missing', async () => {
    await expect(
      setup.usecase.execute({ parkingLotId: '00000000-0000-4000-8000-000000000000' }),
    ).rejects.toBeInstanceOf(ParkingLotNotFoundError);
  });
});
