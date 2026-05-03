import { beforeEach, describe, expect, it } from 'vitest';

import { LicensePlateVO } from '@domain/parking/value-objects/license-plate-vo.ts';
import { InMemoryParkingSessionRepository } from '@app/tests/in-memory-repositories/in-memory-parking-session-repository.ts';
import { InMemoryVehicleRepository } from '@app/tests/in-memory-repositories/in-memory-vehicle-repository.ts';
import { InMemoryDomainEventPublisher } from '@app/tests/factories/in-memory-domain-event-publisher.ts';
import { StaticParkingLotResolver } from '@app/tests/factories/static-parking-lot-resolver.ts';
import { RegisterVehicleEntryAppService } from '@app/services/parking/register-vehicle-entry.app-service.ts';
import { InvalidRecognitionPlateError } from '@app/exceptions/recognition/invalid-recognition-plate-error.ts';

interface Setup {
  service: RegisterVehicleEntryAppService;
  vehicles: InMemoryVehicleRepository;
  sessions: InMemoryParkingSessionRepository;
  publisher: InMemoryDomainEventPublisher;
}

function makeSetup(): Setup {
  const vehicles = new InMemoryVehicleRepository();
  const sessions = new InMemoryParkingSessionRepository();
  const publisher = new InMemoryDomainEventPublisher();
  const service = new RegisterVehicleEntryAppService(
    vehicles,
    sessions,
    new StaticParkingLotResolver(),
    publisher,
  );

  return { service, vehicles, sessions, publisher };
}

describe('RegisterVehicleEntryAppService', () => {
  let setup: Setup;

  beforeEach(() => {
    setup = makeSetup();
  });

  it('should create an active session when no previous session exists for the plate', async () => {
    const result = await setup.service.execute({
      plate: 'ABC1D23',
      entryAt: new Date('2026-04-30T10:00:00Z'),
    });

    expect(result.status).toBe('created');
    const stored = await setup.sessions.findActiveByPlate(LicensePlateVO.from('ABC1D23'));
    expect(stored?.id().value()).toBe(result.sessionId);
  });

  it('should auto-create an anonymous Vehicle when the plate is unknown', async () => {
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

  it('should throw InvalidRecognitionPlateError when plate is null', async () => {
    await expect(
      setup.service.execute({ plate: null, entryAt: new Date('2026-04-30T10:00:00Z') }),
    ).rejects.toBeInstanceOf(InvalidRecognitionPlateError);
  });
});
