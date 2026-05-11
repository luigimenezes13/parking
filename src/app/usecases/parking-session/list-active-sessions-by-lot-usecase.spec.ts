import { beforeEach, describe, expect, it } from 'vitest';

import { ParkingLot } from '@domain/parking/entities/parking-lot.ts';
import { ParkingSession } from '@domain/parking/aggregates/parking-session/parking-session.ts';
import { InMemoryParkingLotRepository } from '@app/tests/in-memory-repositories/in-memory-parking-lot-repository.ts';
import { InMemoryParkingSessionRepository } from '@app/tests/in-memory-repositories/in-memory-parking-session-repository.ts';
import { ListActiveSessionsByLotUseCase } from '@app/usecases/parking-session/list-active-sessions-by-lot-usecase.ts';
import { ParkingLotNotFoundError } from '@app/exceptions/parking-lot/parking-lot-not-found-error.ts';

describe('ListActiveSessionsByLotUseCase', () => {
  let lots: InMemoryParkingLotRepository;
  let sessions: InMemoryParkingSessionRepository;
  let usecase: ListActiveSessionsByLotUseCase;

  beforeEach(() => {
    lots = new InMemoryParkingLotRepository();
    sessions = new InMemoryParkingSessionRepository();
    usecase = new ListActiveSessionsByLotUseCase(sessions, lots);
  });

  it('returns active sessions for the lot ordered by entryAt ascending', async () => {
    const lot = ParkingLot.register({ name: 'Lot', address: 'a', totalCapacity: 10 });
    await lots.save(lot);

    const earlier = ParkingSession.enter({
      parkingLotId: lot.id(),
      entryAt: new Date('2026-04-30T09:00:00Z'),
    });
    const later = ParkingSession.enter({
      parkingLotId: lot.id(),
      entryAt: new Date('2026-04-30T10:00:00Z'),
    });
    await sessions.save(later);
    await sessions.save(earlier);

    const found = await usecase.execute({ parkingLotId: lot.id().value() });

    expect(found).toHaveLength(2);
    expect(found[0]?.id().equals(earlier.id())).toBe(true);
    expect(found[1]?.id().equals(later.id())).toBe(true);
  });

  it('throws ParkingLotNotFoundError when lot is missing', async () => {
    await expect(
      usecase.execute({ parkingLotId: '00000000-0000-4000-8000-000000000000' }),
    ).rejects.toBeInstanceOf(ParkingLotNotFoundError);
  });
});
