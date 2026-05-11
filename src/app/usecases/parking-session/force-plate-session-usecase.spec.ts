import { beforeEach, describe, expect, it } from 'vitest';

import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { LicensePlateVO } from '@domain/parking/value-objects/license-plate-vo.ts';
import { makeVehicle } from '@domain/parking/__tests__/factories/vehicle.factory.ts';
import {
  enterSession,
  makeActiveSession,
} from '@domain/parking/__tests__/factories/parking-session.factory.ts';
import { SessionAlreadyHasVehicleError } from '@domain/parking/errors/session-already-has-vehicle.ts';
import { InvalidLicensePlateError } from '@domain/parking/errors/invalid-license-plate.ts';
import { InMemoryParkingSessionRepository } from '@app/tests/in-memory-repositories/in-memory-parking-session-repository.ts';
import { InMemoryVehicleRepository } from '@app/tests/in-memory-repositories/in-memory-vehicle-repository.ts';
import { InMemoryDomainEventPublisher } from '@app/tests/factories/in-memory-domain-event-publisher.ts';
import { ForcePlateSessionUseCase } from '@app/usecases/parking-session/force-plate-session-usecase.ts';
import { ForcePlateSessionRequest } from '@app/dto/inputs/parking-session/force-plate-session-input.ts';
import { ParkingSessionNotFoundError } from '@app/exceptions/parking-session/parking-session-not-found-error.ts';

interface Setup {
  sessions: InMemoryParkingSessionRepository;
  vehicles: InMemoryVehicleRepository;
  publisher: InMemoryDomainEventPublisher;
  usecase: ForcePlateSessionUseCase;
}

async function makeSetup(): Promise<Setup> {
  const sessions = new InMemoryParkingSessionRepository();
  const vehicles = new InMemoryVehicleRepository();
  const publisher = new InMemoryDomainEventPublisher();
  const usecase = new ForcePlateSessionUseCase(sessions, vehicles, publisher);
  return { sessions, vehicles, publisher, usecase };
}

describe('ForcePlateSessionUseCase', () => {
  let setup: Setup;

  beforeEach(async () => {
    setup = await makeSetup();
  });

  it('assigns an anonymous vehicle to a pending session', async () => {
    const parkingLotId = UniqueIdentifier.create();
    const session = makeActiveSession({ parkingLotId, vehicle: null });
    await setup.sessions.save(session);

    const updated = await setup.usecase.execute(
      new ForcePlateSessionRequest({
        sessionId: session.id().value(),
        plate: 'ABC1D23',
      }),
    );

    expect(updated.hasVehicleAssigned()).toBe(true);
    expect(updated.licensePlate()?.value()).toBe('ABC1D23');
    const stored = await setup.vehicles.findByLicensePlate(LicensePlateVO.from('ABC1D23'));
    expect(stored).not.toBeNull();
    expect(setup.publisher.published).toEqual([]);
  });

  it('reuses an existing vehicle when the plate is already registered', async () => {
    const parkingLotId = UniqueIdentifier.create();
    const existing = makeVehicle({ parkingLotId, licensePlate: 'XYZ9K88' });
    await setup.vehicles.save(existing);

    const session = makeActiveSession({ parkingLotId, vehicle: null });
    await setup.sessions.save(session);

    const updated = await setup.usecase.execute(
      new ForcePlateSessionRequest({
        sessionId: session.id().value(),
        plate: 'XYZ9K88',
      }),
    );

    expect(updated.vehicle()?.id().equals(existing.id())).toBe(true);
  });

  it('throws ParkingSessionNotFoundError when missing', async () => {
    await expect(
      setup.usecase.execute(
        new ForcePlateSessionRequest({
          sessionId: '00000000-0000-4000-8000-000000000000',
          plate: 'ABC1D23',
        }),
      ),
    ).rejects.toBeInstanceOf(ParkingSessionNotFoundError);
  });

  it('throws InvalidLicensePlateError when plate has valid length but invalid format', async () => {
    const parkingLotId = UniqueIdentifier.create();
    const session = enterSession({ parkingLotId, vehicle: null });
    await setup.sessions.save(session);

    await expect(
      setup.usecase.execute(
        new ForcePlateSessionRequest({ sessionId: session.id().value(), plate: 'AAAAAAA' }),
      ),
    ).rejects.toBeInstanceOf(InvalidLicensePlateError);
  });

  it('throws SessionAlreadyHasVehicleError when session already has a vehicle', async () => {
    const parkingLotId = UniqueIdentifier.create();
    const vehicle = makeVehicle({ parkingLotId });
    const session = makeActiveSession({ parkingLotId, vehicle });
    await setup.sessions.save(session);

    await expect(
      setup.usecase.execute(
        new ForcePlateSessionRequest({ sessionId: session.id().value(), plate: 'XYZ9K88' }),
      ),
    ).rejects.toBeInstanceOf(SessionAlreadyHasVehicleError);
  });
});
