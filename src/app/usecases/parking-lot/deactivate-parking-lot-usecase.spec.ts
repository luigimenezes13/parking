import { beforeEach, describe, expect, it } from 'vitest';

import { EntityAlreadyDeactivatedError } from '@domain/parking/errors/entity-already-deactivated.ts';
import { InMemoryParkingLotRepository } from '@app/tests/in-memory-repositories/in-memory-parking-lot-repository.ts';
import { InMemoryParkingSessionRepository } from '@app/tests/in-memory-repositories/in-memory-parking-session-repository.ts';
import { DeactivateParkingLotUseCase } from '@app/usecases/parking-lot/deactivate-parking-lot-usecase.ts';
import { ParkingLotNotFoundError } from '@app/exceptions/parking-lot/parking-lot-not-found-error.ts';
import { ParkingLotHasActiveSessionsError } from '@app/exceptions/parking-lot/parking-lot-has-active-sessions-error.ts';
import { makeParkingLot } from '@domain/parking/__tests__/factories/parking-lot.factory.ts';
import { enterSession } from '@domain/parking/__tests__/factories/parking-session.factory.ts';

interface Setup {
  parkingLots: InMemoryParkingLotRepository;
  sessions: InMemoryParkingSessionRepository;
  usecase: DeactivateParkingLotUseCase;
}

async function makeSetup(): Promise<Setup> {
  const parkingLots = new InMemoryParkingLotRepository();
  const sessions = new InMemoryParkingSessionRepository();
  const usecase = new DeactivateParkingLotUseCase(parkingLots, sessions);
  return { parkingLots, sessions, usecase };
}

describe('DeactivateParkingLotUseCase', () => {
  let setup: Setup;

  beforeEach(async () => {
    setup = await makeSetup();
  });

  it('marks the parking lot as deactivated when there are no active sessions', async () => {
    const lot = makeParkingLot({ name: 'Lot', address: 'addr', totalCapacity: 10 });
    await setup.parkingLots.save(lot);

    const deactivated = await setup.usecase.execute({ parkingLotId: lot.id().value() });

    expect(deactivated.isDeactivated()).toBe(true);
  });

  it('throws ParkingLotNotFoundError when missing', async () => {
    await expect(
      setup.usecase.execute({ parkingLotId: '00000000-0000-4000-8000-000000000000' }),
    ).rejects.toBeInstanceOf(ParkingLotNotFoundError);
  });

  it('throws ParkingLotHasActiveSessionsError when there are active sessions', async () => {
    const lot = makeParkingLot({ name: 'Lot', address: 'addr', totalCapacity: 10 });
    await setup.parkingLots.save(lot);

    const session = enterSession({ parkingLotId: lot.id(), vehicle: null });
    await setup.sessions.save(session);

    await expect(setup.usecase.execute({ parkingLotId: lot.id().value() })).rejects.toBeInstanceOf(
      ParkingLotHasActiveSessionsError,
    );
  });

  it('throws EntityAlreadyDeactivatedError when already deactivated', async () => {
    const lot = makeParkingLot({ name: 'Lot', address: 'addr', totalCapacity: 10 });
    lot.deactivate(new Date());
    await setup.parkingLots.save(lot);

    await expect(setup.usecase.execute({ parkingLotId: lot.id().value() })).rejects.toBeInstanceOf(
      EntityAlreadyDeactivatedError,
    );
  });
});
