import { beforeEach, describe, expect, it } from 'vitest';

import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { LicensePlateVO } from '@domain/parking/value-objects/license-plate-vo.ts';
import { makeParkingSpot } from '@domain/parking/__tests__/factories/parking-spot.factory.ts';
import { makeVehicle } from '@domain/parking/__tests__/factories/vehicle.factory.ts';
import { makeActiveSession } from '@domain/parking/__tests__/factories/parking-session.factory.ts';
import { InMemoryParkingSessionRepository } from '@app/tests/in-memory-repositories/in-memory-parking-session-repository.ts';
import { InMemoryDomainEventPublisher } from '@app/tests/factories/in-memory-domain-event-publisher.ts';
import { StaticParkingLotResolver } from '@app/tests/factories/static-parking-lot-resolver.ts';
import { FinishParkingSessionAppService } from '@app/services/parking/finish-parking-session.app-service.ts';
import { ActiveSessionNotFoundError } from '@app/exceptions/recognition/active-session-not-found-error.ts';

interface Setup {
  service: FinishParkingSessionAppService;
  sessions: InMemoryParkingSessionRepository;
  publisher: InMemoryDomainEventPublisher;
  resolver: StaticParkingLotResolver;
}

function makeSetup(): Setup {
  const sessions = new InMemoryParkingSessionRepository();
  const publisher = new InMemoryDomainEventPublisher();
  const resolver = new StaticParkingLotResolver();
  const service = new FinishParkingSessionAppService(sessions, resolver, publisher);
  return { service, sessions, publisher, resolver };
}

async function seedSession(setup: Setup, plate: string): Promise<{ sessionId: string }> {
  const parkingLotId = setup.resolver.resolveDefault();
  const vehicle = makeVehicle({ parkingLotId, licensePlate: plate });
  const session = makeActiveSession({
    parkingLotId,
    vehicle,
    entryAt: new Date('2026-04-30T10:00:00Z'),
  });
  const spot = makeParkingSpot({ parkingLotId, code: 'A' });
  session.assignSpot({ spot, occupiedAt: new Date('2026-04-30T10:00:30Z') });
  session.releaseSpot({ releasedAt: new Date('2026-04-30T11:00:00Z') });
  session.pullDomainEvents();
  await setup.sessions.save(session);
  return { sessionId: session.id().value() };
}

describe('FinishParkingSessionAppService', () => {
  let setup: Setup;

  beforeEach(() => {
    setup = makeSetup();
  });

  it('should mark the session as FINISHED and persist the exit time', async () => {
    const { sessionId } = await seedSession(setup, 'ABC1D23');
    const exitAt = new Date('2026-04-30T11:00:30Z');

    await setup.service.execute({ plate: 'ABC1D23', exitAt });

    const stored = await setup.sessions.findById(UniqueIdentifier.fromExisting(sessionId));
    expect(stored?.isFinished()).toBe(true);
    expect(stored?.exitAt()?.toISOString()).toBe(exitAt.toISOString());
  });

  it('should remove the session from active queries by plate after finishing', async () => {
    await seedSession(setup, 'ABC1D23');

    await setup.service.execute({ plate: 'ABC1D23', exitAt: new Date('2026-04-30T11:00:30Z') });

    const active = await setup.sessions.findActiveByPlate(LicensePlateVO.from('ABC1D23'));
    expect(active).toBeNull();
  });

  it('should publish VehicleExited and SessionFinished domain events', async () => {
    await seedSession(setup, 'ABC1D23');

    await setup.service.execute({
      plate: 'ABC1D23',
      exitAt: new Date('2026-04-30T11:00:30Z'),
    });

    const eventNames = setup.publisher.published.map((event) => event.eventName);
    expect(eventNames).toEqual(['parking.session.vehicle-exited', 'parking.session.finished']);
  });

  it('should fall back to most recent active session when plate is null', async () => {
    const { sessionId } = await seedSession(setup, 'ABC1D23');

    await setup.service.execute({ plate: null, exitAt: new Date('2026-04-30T11:00:30Z') });

    const stored = await setup.sessions.findById(
      (
        await import('@domain/shared/value-objects/unique-identifier.ts')
      ).UniqueIdentifier.fromExisting(sessionId),
    );
    expect(stored?.isFinished()).toBe(true);
  });

  it('should throw ActiveSessionNotFoundError when no active session matches the plate', async () => {
    await expect(
      setup.service.execute({ plate: 'ABC1D23', exitAt: new Date() }),
    ).rejects.toBeInstanceOf(ActiveSessionNotFoundError);
  });
});
