import { beforeEach, describe, expect, it } from 'vitest';

import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { LicensePlateVO } from '@domain/parking/value-objects/license-plate-vo.ts';
import { Vehicle } from '@domain/parking/entities/vehicle.ts';
import { ParkingSession } from '@domain/parking/aggregates/parking-session/parking-session.ts';
import { SessionAlreadyHasVehicleError } from '@domain/parking/errors/session-already-has-vehicle.ts';
import { InvalidLicensePlateError } from '@domain/parking/errors/invalid-license-plate.ts';
import { InMemoryParkingSessionRepository } from '@app/tests/in-memory-repositories/in-memory-parking-session-repository.ts';
import { InMemoryVehicleRepository } from '@app/tests/in-memory-repositories/in-memory-vehicle-repository.ts';
import { InMemoryDomainEventPublisher } from '@app/tests/factories/in-memory-domain-event-publisher.ts';
import { ForcePlateSessionUseCase } from '@app/usecases/parking-session/force-plate-session-usecase.ts';
import { ForcePlateSessionRequest } from '@app/dto/inputs/parking-session/force-plate-session-input.ts';
import { ParkingSessionNotFoundError } from '@app/exceptions/parking-session/parking-session-not-found-error.ts';

describe('ForcePlateSessionUseCase', () => {
  let sessions: InMemoryParkingSessionRepository;
  let vehicles: InMemoryVehicleRepository;
  let publisher: InMemoryDomainEventPublisher;
  let usecase: ForcePlateSessionUseCase;

  beforeEach(() => {
    sessions = new InMemoryParkingSessionRepository();
    vehicles = new InMemoryVehicleRepository();
    publisher = new InMemoryDomainEventPublisher();
    usecase = new ForcePlateSessionUseCase(sessions, vehicles, publisher);
  });

  it('assigns an anonymous vehicle to a pending session', async () => {
    const parkingLotId = UniqueIdentifier.create();
    const session = ParkingSession.enter({
      parkingLotId,
      entryAt: new Date('2026-04-30T10:00:00Z'),
    });
    session.pullDomainEvents();
    await sessions.save(session);

    const updated = await usecase.execute(
      new ForcePlateSessionRequest({
        sessionId: session.id().value(),
        plate: 'ABC1D23',
      }),
    );

    expect(updated.hasVehicleAssigned()).toBe(true);
    expect(updated.licensePlate()?.value()).toBe('ABC1D23');
    const stored = await vehicles.findByLicensePlate(LicensePlateVO.from('ABC1D23'));
    expect(stored).not.toBeNull();
    expect(publisher.published).toEqual([]);
  });

  it('reuses an existing vehicle when the plate is already registered', async () => {
    const parkingLotId = UniqueIdentifier.create();
    const existing = Vehicle.registerAnonymous({
      parkingLotId,
      licensePlate: LicensePlateVO.from('XYZ9K88'),
    });
    await vehicles.save(existing);

    const session = ParkingSession.enter({
      parkingLotId,
      entryAt: new Date('2026-04-30T10:00:00Z'),
    });
    session.pullDomainEvents();
    await sessions.save(session);

    const updated = await usecase.execute(
      new ForcePlateSessionRequest({
        sessionId: session.id().value(),
        plate: 'XYZ9K88',
      }),
    );

    expect(updated.vehicle()?.id().equals(existing.id())).toBe(true);
  });

  it('throws ParkingSessionNotFoundError when missing', async () => {
    await expect(
      usecase.execute(
        new ForcePlateSessionRequest({
          sessionId: '00000000-0000-4000-8000-000000000000',
          plate: 'ABC1D23',
        }),
      ),
    ).rejects.toBeInstanceOf(ParkingSessionNotFoundError);
  });

  it('throws InvalidLicensePlateError when plate has valid length but invalid format', async () => {
    const parkingLotId = UniqueIdentifier.create();
    const session = ParkingSession.enter({
      parkingLotId,
      entryAt: new Date('2026-04-30T10:00:00Z'),
    });
    await sessions.save(session);

    await expect(
      usecase.execute(
        new ForcePlateSessionRequest({ sessionId: session.id().value(), plate: 'AAAAAAA' }),
      ),
    ).rejects.toBeInstanceOf(InvalidLicensePlateError);
  });

  it('throws SessionAlreadyHasVehicleError when session already has a vehicle', async () => {
    const parkingLotId = UniqueIdentifier.create();
    const vehicle = Vehicle.registerAnonymous({
      parkingLotId,
      licensePlate: LicensePlateVO.from('ABC1D23'),
    });
    const session = ParkingSession.enter({
      parkingLotId,
      vehicle,
      entryAt: new Date('2026-04-30T10:00:00Z'),
    });
    session.pullDomainEvents();
    await sessions.save(session);

    await expect(
      usecase.execute(
        new ForcePlateSessionRequest({ sessionId: session.id().value(), plate: 'XYZ9K88' }),
      ),
    ).rejects.toBeInstanceOf(SessionAlreadyHasVehicleError);
  });
});
