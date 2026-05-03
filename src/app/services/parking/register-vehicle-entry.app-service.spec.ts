import { beforeEach, describe, expect, it } from 'vitest';

import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { LicensePlateVO } from '@domain/parking/value-objects/license-plate-vo.ts';
import { InMemoryParkingSessionRepository } from '@app/tests/in-memory-repositories/in-memory-parking-session-repository.ts';
import { InMemoryVehicleRepository } from '@app/tests/in-memory-repositories/in-memory-vehicle-repository.ts';
import { InMemoryDomainEventPublisher } from '@app/tests/factories/in-memory-domain-event-publisher.ts';
import { StaticParkingLotResolver } from '@app/tests/factories/static-parking-lot-resolver.ts';
import { RegisterVehicleEntryAppService } from '@app/services/parking/register-vehicle-entry.app-service.ts';

interface Setup {
  service: RegisterVehicleEntryAppService;
  vehicles: InMemoryVehicleRepository;
  sessions: InMemoryParkingSessionRepository;
  publisher: InMemoryDomainEventPublisher;
  resolver: StaticParkingLotResolver;
}

function makeSetup(): Setup {
  const vehicles = new InMemoryVehicleRepository();
  const sessions = new InMemoryParkingSessionRepository();
  const publisher = new InMemoryDomainEventPublisher();
  const resolver = new StaticParkingLotResolver();
  const service = new RegisterVehicleEntryAppService(vehicles, sessions, resolver, publisher);

  return { service, vehicles, sessions, publisher, resolver };
}

describe('RegisterVehicleEntryAppService', () => {
  let setup: Setup;

  beforeEach(() => {
    setup = makeSetup();
  });

  it('should create an active session with vehicle when plate is known', async () => {
    const result = await setup.service.execute({
      plate: 'ABC1D23',
      entryAt: new Date('2026-04-30T10:00:00Z'),
    });

    expect(result.status).toBe('created-with-vehicle');
    const stored = await setup.sessions.findActiveByPlate(LicensePlateVO.from('ABC1D23'));
    expect(stored?.id().value()).toBe(result.sessionId);
  });

  it('should auto-create an anonymous Vehicle when the plate is unknown to the system', async () => {
    await setup.service.execute({
      plate: 'XYZ9K88',
      entryAt: new Date('2026-04-30T10:00:00Z'),
    });

    const vehicle = await setup.vehicles.findByLicensePlate(LicensePlateVO.from('XYZ9K88'));
    expect(vehicle).not.toBeNull();
    expect(vehicle?.driverId()).toBeNull();
  });

  it('should publish VehicleEntered and SessionStarted domain events', async () => {
    await setup.service.execute({
      plate: 'ABC1D23',
      entryAt: new Date('2026-04-30T10:00:00Z'),
    });

    const eventNames = setup.publisher.published.map((event) => event.eventName);
    expect(eventNames).toEqual(['parking.session.vehicle-entered', 'parking.session.started']);
  });

  it('should discard a duplicate vehicle.entered when there is already an active session', async () => {
    await setup.service.execute({
      plate: 'ABC1D23',
      entryAt: new Date('2026-04-30T10:00:00Z'),
    });
    setup.publisher.pull();

    const second = await setup.service.execute({
      plate: 'ABC1D23',
      entryAt: new Date('2026-04-30T10:01:00Z'),
    });

    expect(second.status).toBe('duplicate-discarded');
    expect(setup.publisher.published).toHaveLength(0);
  });

  it('should create a pending session when plate is null (vehicle not yet recognized)', async () => {
    const result = await setup.service.execute({
      plate: null,
      entryAt: new Date('2026-04-30T10:00:00Z'),
    });

    expect(result.status).toBe('created-pending-vehicle');
    const stored = await setup.sessions.findById(UniqueIdentifier.fromExisting(result.sessionId));
    expect(stored?.vehicle()).toBeNull();
    expect(stored?.isPendingVehicle()).toBe(true);
  });

  it('should associate the pending session to the configured parking lot', async () => {
    const result = await setup.service.execute({
      plate: null,
      entryAt: new Date('2026-04-30T10:00:00Z'),
    });

    const stored = await setup.sessions.findOldestPendingVehicle(setup.resolver.resolveDefault());
    expect(stored?.id().value()).toBe(result.sessionId);
  });
});
