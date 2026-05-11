import { beforeEach, describe, expect, it } from 'vitest';

import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { Vehicle } from '@domain/parking/entities/vehicle.ts';
import { LicensePlateVO } from '@domain/parking/value-objects/license-plate-vo.ts';
import { ParkingSession } from '@domain/parking/aggregates/parking-session/parking-session.ts';
import { InMemoryParkingSessionRepository } from '@app/tests/in-memory-repositories/in-memory-parking-session-repository.ts';
import { InMemoryVehicleRepository } from '@app/tests/in-memory-repositories/in-memory-vehicle-repository.ts';
import { ListSessionsByVehicleUseCase } from '@app/usecases/parking-session/list-sessions-by-vehicle-usecase.ts';
import { VehicleNotFoundError } from '@app/exceptions/vehicle/vehicle-not-found-error.ts';

describe('ListSessionsByVehicleUseCase', () => {
  let sessions: InMemoryParkingSessionRepository;
  let vehicles: InMemoryVehicleRepository;
  let usecase: ListSessionsByVehicleUseCase;

  beforeEach(() => {
    sessions = new InMemoryParkingSessionRepository();
    vehicles = new InMemoryVehicleRepository();
    usecase = new ListSessionsByVehicleUseCase(sessions, vehicles);
  });

  it('returns all sessions for the vehicle ordered by entryAt descending', async () => {
    const parkingLotId = UniqueIdentifier.create();
    const vehicle = Vehicle.registerAnonymous({
      parkingLotId,
      licensePlate: LicensePlateVO.from('ABC1D23'),
    });
    await vehicles.save(vehicle);

    const earlier = ParkingSession.enter({
      parkingLotId,
      vehicle,
      entryAt: new Date('2026-04-29T10:00:00Z'),
    });
    earlier.finish({ exitAt: new Date('2026-04-29T11:00:00Z') });

    const recent = ParkingSession.enter({
      parkingLotId,
      vehicle,
      entryAt: new Date('2026-04-30T10:00:00Z'),
    });

    await sessions.save(earlier);
    await sessions.save(recent);

    const found = await usecase.execute({ vehicleId: vehicle.id().value() });

    expect(found).toHaveLength(2);
    expect(found[0]?.id().equals(recent.id())).toBe(true);
    expect(found[1]?.id().equals(earlier.id())).toBe(true);
  });

  it('throws VehicleNotFoundError when vehicle is missing', async () => {
    await expect(
      usecase.execute({ vehicleId: '00000000-0000-4000-8000-000000000000' }),
    ).rejects.toBeInstanceOf(VehicleNotFoundError);
  });
});
