import { beforeEach, describe, expect, it } from 'vitest';

import { LicensePlateVO } from '@domain/parking/value-objects/license-plate-vo.ts';
import { ParkingSession } from '@domain/parking/aggregates/parking-session/parking-session.ts';
import { Vehicle } from '@domain/parking/entities/vehicle.ts';
import { makeParkingSpot } from '@domain/parking/__tests__/factories/parking-spot.factory.ts';
import { InMemoryParkingSessionRepository } from '@app/tests/in-memory-repositories/in-memory-parking-session-repository.ts';
import { InMemoryParkingSpotRepository } from '@app/tests/in-memory-repositories/in-memory-parking-spot-repository.ts';
import { InMemoryDomainEventPublisher } from '@app/tests/factories/in-memory-domain-event-publisher.ts';
import { StaticParkingLotResolver } from '@app/tests/factories/static-parking-lot-resolver.ts';
import { RegisterSpotReleaseAppService } from '@app/services/parking/register-spot-release.app-service.ts';
import { ActiveSessionNotFoundError } from '@app/exceptions/recognition/active-session-not-found-error.ts';
import { ParkingSpotNotFoundError } from '@app/exceptions/recognition/parking-spot-not-found-error.ts';

interface Setup {
  service: RegisterSpotReleaseAppService;
  spots: InMemoryParkingSpotRepository;
  sessions: InMemoryParkingSessionRepository;
  publisher: InMemoryDomainEventPublisher;
  resolver: StaticParkingLotResolver;
}

function makeSetup(): Setup {
  const spots = new InMemoryParkingSpotRepository();
  const sessions = new InMemoryParkingSessionRepository();
  const publisher = new InMemoryDomainEventPublisher();
  const resolver = new StaticParkingLotResolver();
  const service = new RegisterSpotReleaseAppService(spots, sessions, resolver, publisher);
  return { service, spots, sessions, publisher, resolver };
}

async function seedActiveSessionWithSpot(
  setup: Setup,
  plate: string,
  code: string,
): Promise<{ sessionId: string }> {
  const spot = makeParkingSpot({ parkingLotId: setup.resolver.resolveDefault(), code });
  await setup.spots.save(spot);
  const vehicle = Vehicle.registerAnonymous({
    parkingLotId: setup.resolver.resolveDefault(),
    licensePlate: LicensePlateVO.from(plate),
  });
  const session = ParkingSession.enter({
    parkingLotId: setup.resolver.resolveDefault(),
    vehicle,
    entryAt: new Date('2026-04-30T10:00:00Z'),
  });
  session.assignSpot({ spot, occupiedAt: new Date('2026-04-30T10:00:30Z') });
  session.pullDomainEvents();
  await setup.sessions.save(session);
  return { sessionId: session.id().value() };
}

describe('RegisterSpotReleaseAppService', () => {
  let setup: Setup;

  beforeEach(() => {
    setup = makeSetup();
  });

  it('should release the spot of the matching active session', async () => {
    const { sessionId } = await seedActiveSessionWithSpot(setup, 'ABC1D23', 'A');

    await setup.service.execute({
      plate: 'ABC1D23',
      spotCode: 'A',
      releasedAt: new Date('2026-04-30T11:00:00Z'),
    });

    const stored = await setup.sessions.findActiveByPlate(LicensePlateVO.from('ABC1D23'));
    expect(stored?.id().value()).toBe(sessionId);
    expect(stored?.spotReleasedAt()).not.toBeNull();
    expect(stored?.spot()?.isFree()).toBe(true);
  });

  it('should fall back to spot lookup when plate is null', async () => {
    await seedActiveSessionWithSpot(setup, 'ABC1D23', 'A');

    await setup.service.execute({
      plate: null,
      spotCode: 'A',
      releasedAt: new Date('2026-04-30T11:00:00Z'),
    });

    const stored = await setup.sessions.findActiveByPlate(LicensePlateVO.from('ABC1D23'));
    expect(stored?.spotReleasedAt()).not.toBeNull();
  });

  it('should publish a SpotReleased domain event', async () => {
    await seedActiveSessionWithSpot(setup, 'ABC1D23', 'A');

    await setup.service.execute({
      plate: 'ABC1D23',
      spotCode: 'A',
      releasedAt: new Date('2026-04-30T11:00:00Z'),
    });

    const eventNames = setup.publisher.published.map((event) => event.eventName);
    expect(eventNames).toContain('parking.session.spot-released');
  });

  it('should throw ParkingSpotNotFoundError when spot is unknown', async () => {
    await expect(
      setup.service.execute({
        plate: 'ABC1D23',
        spotCode: 'Z',
        releasedAt: new Date(),
      }),
    ).rejects.toBeInstanceOf(ParkingSpotNotFoundError);
  });

  it('should throw ActiveSessionNotFoundError when no session matches plate or spot', async () => {
    const spot = makeParkingSpot({ parkingLotId: setup.resolver.resolveDefault(), code: 'A' });
    await setup.spots.save(spot);

    await expect(
      setup.service.execute({
        plate: 'ABC1D23',
        spotCode: 'A',
        releasedAt: new Date(),
      }),
    ).rejects.toBeInstanceOf(ActiveSessionNotFoundError);
  });
});
