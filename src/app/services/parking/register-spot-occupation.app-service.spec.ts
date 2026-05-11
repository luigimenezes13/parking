import { beforeEach, describe, expect, it } from 'vitest';

import { LicensePlateVO } from '@domain/parking/value-objects/license-plate-vo.ts';
import { makeParkingSpot } from '@domain/parking/__tests__/factories/parking-spot.factory.ts';
import { makeVehicle } from '@domain/parking/__tests__/factories/vehicle.factory.ts';
import { makeActiveSession } from '@domain/parking/__tests__/factories/parking-session.factory.ts';
import { InMemoryParkingSessionRepository } from '@app/tests/in-memory-repositories/in-memory-parking-session-repository.ts';
import { InMemoryParkingSpotRepository } from '@app/tests/in-memory-repositories/in-memory-parking-spot-repository.ts';
import { InMemoryVehicleRepository } from '@app/tests/in-memory-repositories/in-memory-vehicle-repository.ts';
import { InMemoryDomainEventPublisher } from '@app/tests/factories/in-memory-domain-event-publisher.ts';
import { StaticParkingLotResolver } from '@app/tests/factories/static-parking-lot-resolver.ts';
import { RegisterSpotOccupationAppService } from '@app/services/parking/register-spot-occupation.app-service.ts';
import { InvalidRecognitionPlateError } from '@app/exceptions/recognition/invalid-recognition-plate-error.ts';
import { ParkingSpotNotFoundError } from '@app/exceptions/recognition/parking-spot-not-found-error.ts';

interface Setup {
  service: RegisterSpotOccupationAppService;
  vehicles: InMemoryVehicleRepository;
  spots: InMemoryParkingSpotRepository;
  sessions: InMemoryParkingSessionRepository;
  publisher: InMemoryDomainEventPublisher;
  resolver: StaticParkingLotResolver;
}

function makeSetup(): Setup {
  const vehicles = new InMemoryVehicleRepository();
  const spots = new InMemoryParkingSpotRepository();
  const sessions = new InMemoryParkingSessionRepository();
  const publisher = new InMemoryDomainEventPublisher();
  const resolver = new StaticParkingLotResolver();
  const service = new RegisterSpotOccupationAppService(
    vehicles,
    spots,
    sessions,
    resolver,
    publisher,
  );
  return { service, vehicles, spots, sessions, publisher, resolver };
}

describe('RegisterSpotOccupationAppService', () => {
  let setup: Setup;

  beforeEach(async () => {
    setup = makeSetup();
    const spot = makeParkingSpot({ parkingLotId: setup.resolver.resolveDefault(), code: 'A' });
    await setup.spots.save(spot);
  });

  it('should assign the spot to the existing active session and persist the change', async () => {
    const parkingLotId = setup.resolver.resolveDefault();
    const vehicle = makeVehicle({ parkingLotId, licensePlate: 'ABC1D23' });
    await setup.vehicles.save(vehicle);
    const session = makeActiveSession({
      parkingLotId,
      vehicle,
      entryAt: new Date('2026-04-30T10:00:00Z'),
    });
    await setup.sessions.save(session);

    await setup.service.execute({
      plate: 'ABC1D23',
      spotCode: 'A',
      confidence: 0.95,
      occupiedAt: new Date('2026-04-30T10:00:30Z'),
    });

    const stored = await setup.sessions.findActiveByPlate(LicensePlateVO.from('ABC1D23'));
    expect(stored?.spot()?.code().value()).toBe('A');
  });

  it('should auto-create the Vehicle and the ParkingSession when neither exists yet', async () => {
    const result = await setup.service.execute({
      plate: 'XYZ9K88',
      spotCode: 'A',
      confidence: 0.91,
      occupiedAt: new Date('2026-04-30T10:00:30Z'),
    });

    const vehicle = await setup.vehicles.findByLicensePlate(LicensePlateVO.from('XYZ9K88'));
    expect(vehicle).not.toBeNull();
    expect(result.sessionId).toBeTruthy();

    const stored = await setup.sessions.findActiveByPlate(LicensePlateVO.from('XYZ9K88'));
    expect(stored?.id().value()).toBe(result.sessionId);
    expect(stored?.spot()?.code().value()).toBe('A');
  });

  it('should publish a SpotOccupied domain event', async () => {
    const parkingLotId = setup.resolver.resolveDefault();
    const vehicle = makeVehicle({ parkingLotId, licensePlate: 'ABC1D23' });
    await setup.vehicles.save(vehicle);
    const session = makeActiveSession({
      parkingLotId,
      vehicle,
      entryAt: new Date('2026-04-30T10:00:00Z'),
    });
    await setup.sessions.save(session);

    await setup.service.execute({
      plate: 'ABC1D23',
      spotCode: 'A',
      confidence: 0.95,
      occupiedAt: new Date('2026-04-30T10:00:30Z'),
    });

    const eventNames = setup.publisher.published.map((event) => event.eventName);
    expect(eventNames).toContain('parking.session.spot-occupied');
  });

  it('should throw InvalidRecognitionPlateError when plate is null', async () => {
    await expect(
      setup.service.execute({
        plate: null,
        spotCode: 'A',
        confidence: 0,
        occupiedAt: new Date(),
      }),
    ).rejects.toBeInstanceOf(InvalidRecognitionPlateError);
  });

  it('should throw ParkingSpotNotFoundError when spot code does not exist', async () => {
    await expect(
      setup.service.execute({
        plate: 'ABC1D23',
        spotCode: 'Z',
        confidence: 0.9,
        occupiedAt: new Date(),
      }),
    ).rejects.toBeInstanceOf(ParkingSpotNotFoundError);
  });
});
