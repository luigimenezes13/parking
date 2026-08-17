import { beforeEach, describe, expect, it } from 'vitest';

import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { makeActiveSession } from '@domain/parking/__tests__/factories/parking-session.factory.ts';
import { makeParkingSpot } from '@domain/parking/__tests__/factories/parking-spot.factory.ts';
import { makeVehicle } from '@domain/parking/__tests__/factories/vehicle.factory.ts';
import { InMemoryParkingSessionRepository } from '@app/tests/in-memory-repositories/in-memory-parking-session-repository.ts';
import { InMemoryDomainEventPublisher } from '@app/tests/factories/in-memory-domain-event-publisher.ts';
import { ExitConfirmationSweeper } from '@infra/jobs/exit-confirmation-sweeper.ts';

const GRACE_MS = 180_000;

interface Setup {
  sessions: InMemoryParkingSessionRepository;
  publisher: InMemoryDomainEventPublisher;
  sweeper: ExitConfirmationSweeper;
}

function makeSetup(): Setup {
  const sessions = new InMemoryParkingSessionRepository();
  const publisher = new InMemoryDomainEventPublisher();
  return { sessions, publisher, sweeper: new ExitConfirmationSweeper(sessions, publisher) };
}

async function makeReleasedSession(setup: Setup, releasedMinutesAgo: number) {
  const parkingLotId = UniqueIdentifier.create();
  const session = makeActiveSession({
    parkingLotId,
    vehicle: makeVehicle({ parkingLotId }),
  });
  const spot = makeParkingSpot({ parkingLotId, code: 'A' });

  session.assignSpot({ spot, occupiedAt: new Date(Date.now() - 3_600_000) });
  session.releaseSpot({ releasedAt: new Date(Date.now() - releasedMinutesAgo * 60_000) });
  await setup.sessions.save(session);
  // Os app services publicam esses eventos antes de salvar, entao a sessao que o
  // sweeper encontra no banco nunca chega com eventos pendentes.
  session.pullDomainEvents();

  return { session, spot };
}

describe('ExitConfirmationSweeper', () => {
  let setup: Setup;

  beforeEach(() => {
    setup = makeSetup();
  });

  it('finishes a session whose spot stayed released past the grace period', async () => {
    const { session } = await makeReleasedSession(setup, 5);

    await setup.sweeper.confirmExits(GRACE_MS);

    const stored = await setup.sessions.findById(session.id());
    expect(stored?.isActive()).toBe(false);
    expect(stored?.exitAt()).not.toBeNull();

    const eventNames = setup.publisher.published.map((event) => event.eventName);
    expect(eventNames).toEqual(['parking.session.vehicle-exited', 'parking.session.finished']);
  });

  it('keeps the session open while it is still inside the grace period', async () => {
    const { session } = await makeReleasedSession(setup, 1);

    await setup.sweeper.confirmExits(GRACE_MS);

    const stored = await setup.sessions.findById(session.id());
    expect(stored?.isActive()).toBe(true);
    expect(setup.publisher.published).toEqual([]);
  });

  it('leaves a session alone when the vehicle parked again before the grace period ended', async () => {
    const { session } = await makeReleasedSession(setup, 5);
    const otherSpot = makeParkingSpot({ parkingLotId: session.parkingLotId(), code: 'B' });
    session.assignSpot({ spot: otherSpot, occupiedAt: new Date() });
    await setup.sessions.save(session);
    session.pullDomainEvents();

    await setup.sweeper.confirmExits(GRACE_MS);

    const stored = await setup.sessions.findById(session.id());
    expect(stored?.isActive()).toBe(true);
    expect(setup.publisher.published).toEqual([]);
  });

  it('closes the session at the moment the spot was released, not at sweep time', async () => {
    const { session } = await makeReleasedSession(setup, 5);
    const releasedAt = session.spotReleasedAt();

    await setup.sweeper.confirmExits(GRACE_MS);

    const stored = await setup.sessions.findById(session.id());
    expect(stored?.exitAt()?.getTime()).toBe(releasedAt?.getTime());
  });
});
