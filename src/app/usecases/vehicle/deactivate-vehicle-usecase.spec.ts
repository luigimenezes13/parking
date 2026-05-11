import { beforeEach, describe, expect, it } from 'vitest';

import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { Vehicle } from '@domain/parking/entities/vehicle.ts';
import { LicensePlateVO } from '@domain/parking/value-objects/license-plate-vo.ts';
import { ParkingSession } from '@domain/parking/aggregates/parking-session/parking-session.ts';
import { EntityAlreadyDeactivatedError } from '@domain/parking/errors/entity-already-deactivated.ts';
import { InMemoryVehicleRepository } from '@app/tests/in-memory-repositories/in-memory-vehicle-repository.ts';
import { InMemoryParkingSessionRepository } from '@app/tests/in-memory-repositories/in-memory-parking-session-repository.ts';
import { DeactivateVehicleUseCase } from '@app/usecases/vehicle/deactivate-vehicle-usecase.ts';
import { VehicleNotFoundError } from '@app/exceptions/vehicle/vehicle-not-found-error.ts';
import { VehicleHasActiveSessionError } from '@app/exceptions/vehicle/vehicle-has-active-session-error.ts';

describe('DeactivateVehicleUseCase', () => {
  let vehicles: InMemoryVehicleRepository;
  let sessions: InMemoryParkingSessionRepository;
  let usecase: DeactivateVehicleUseCase;

  beforeEach(() => {
    vehicles = new InMemoryVehicleRepository();
    sessions = new InMemoryParkingSessionRepository();
    usecase = new DeactivateVehicleUseCase(vehicles, sessions);
  });

  it('marks the vehicle as deactivated when there is no active session', async () => {
    const vehicle = Vehicle.registerAnonymous({
      parkingLotId: UniqueIdentifier.create(),
      licensePlate: LicensePlateVO.from('ABC1D23'),
    });
    await vehicles.save(vehicle);

    const deactivated = await usecase.execute({ vehicleId: vehicle.id().value() });

    expect(deactivated.isDeactivated()).toBe(true);
  });

  it('throws VehicleNotFoundError when missing', async () => {
    await expect(
      usecase.execute({ vehicleId: '00000000-0000-4000-8000-000000000000' }),
    ).rejects.toBeInstanceOf(VehicleNotFoundError);
  });

  it('throws VehicleHasActiveSessionError when an active session exists for the plate', async () => {
    const parkingLotId = UniqueIdentifier.create();
    const vehicle = Vehicle.registerAnonymous({
      parkingLotId,
      licensePlate: LicensePlateVO.from('ABC1D23'),
    });
    await vehicles.save(vehicle);

    const session = ParkingSession.enter({
      parkingLotId,
      vehicle,
      entryAt: new Date('2026-04-30T10:00:00Z'),
    });
    await sessions.save(session);

    await expect(usecase.execute({ vehicleId: vehicle.id().value() })).rejects.toBeInstanceOf(
      VehicleHasActiveSessionError,
    );
  });

  it('throws EntityAlreadyDeactivatedError when already deactivated', async () => {
    const vehicle = Vehicle.registerAnonymous({
      parkingLotId: UniqueIdentifier.create(),
      licensePlate: LicensePlateVO.from('ABC1D23'),
    });
    vehicle.deactivate(new Date());
    await vehicles.save(vehicle);

    await expect(usecase.execute({ vehicleId: vehicle.id().value() })).rejects.toBeInstanceOf(
      EntityAlreadyDeactivatedError,
    );
  });
});
