import { beforeEach, describe, expect, it } from 'vitest';

import { makeParkingSpot } from '@domain/parking/__tests__/factories/parking-spot.factory.ts';
import { makeParkingLot } from '@domain/parking/__tests__/factories/parking-lot.factory.ts';
import { makeVehicle } from '@domain/parking/__tests__/factories/vehicle.factory.ts';
import { enterSession } from '@domain/parking/__tests__/factories/parking-session.factory.ts';
import { InMemoryParkingLotRepository } from '@app/tests/in-memory-repositories/in-memory-parking-lot-repository.ts';
import { InMemoryParkingSpotRepository } from '@app/tests/in-memory-repositories/in-memory-parking-spot-repository.ts';
import { InMemoryParkingSessionRepository } from '@app/tests/in-memory-repositories/in-memory-parking-session-repository.ts';
import { GetParkingLotMapUseCase } from '@app/usecases/parking-lot/get-parking-lot-map-usecase.ts';
import { ParkingLotNotFoundError } from '@app/exceptions/parking-lot/parking-lot-not-found-error.ts';

interface Setup {
  parkingLots: InMemoryParkingLotRepository;
  spots: InMemoryParkingSpotRepository;
  sessions: InMemoryParkingSessionRepository;
  usecase: GetParkingLotMapUseCase;
}

async function makeSetup(): Promise<Setup> {
  const parkingLots = new InMemoryParkingLotRepository();
  const spots = new InMemoryParkingSpotRepository();
  const sessions = new InMemoryParkingSessionRepository();
  const usecase = new GetParkingLotMapUseCase(parkingLots, spots, sessions);
  return { parkingLots, spots, sessions, usecase };
}

describe('GetParkingLotMapUseCase', () => {
  let setup: Setup;

  beforeEach(async () => {
    setup = await makeSetup();
  });

  it('builds a map view with floors, grid dimensions, and occupancy summary', async () => {
    const lot = makeParkingLot({ name: 'Lot Map', address: 'addr', totalCapacity: 10 });
    await setup.parkingLots.save(lot);

    const spotA = makeParkingSpot({
      parkingLotId: lot.id(),
      code: 'A1',
      floor: 1,
      row: 1,
      column: 1,
    });
    const spotB = makeParkingSpot({
      parkingLotId: lot.id(),
      code: 'A2',
      floor: 1,
      row: 1,
      column: 2,
    });
    const spotC = makeParkingSpot({
      parkingLotId: lot.id(),
      code: 'B1',
      floor: 2,
      row: 1,
      column: 1,
    });
    await setup.spots.save(spotA);
    await setup.spots.save(spotB);
    await setup.spots.save(spotC);

    const vehicle = makeVehicle({
      parkingLotId: lot.id(),
      licensePlate: 'ABC1D23',
      model: 'Corolla',
      color: 'prata',
    });

    const entryAt = new Date('2026-04-30T10:00:00Z');
    const session = enterSession({ parkingLotId: lot.id(), vehicle, entryAt });
    session.assignSpot({ spot: spotA, occupiedAt: entryAt });
    session.pullDomainEvents();
    await setup.spots.save(spotA);
    await setup.sessions.save(session);

    const view = await setup.usecase.execute({
      parkingLotId: lot.id().value(),
      now: new Date('2026-04-30T10:30:00Z'),
    });

    expect(view.parkingLot.name).toBe('Lot Map');
    expect(view.occupancy).toEqual({ free: 2, occupied: 1, reserved: 0, total: 3 });

    expect(view.floors).toHaveLength(2);
    const floor1 = view.floors.find((floor) => floor.floor === 1)!;
    expect(floor1.grid).toEqual({ rows: 1, columns: 2 });
    expect(floor1.spots).toHaveLength(2);

    const occupied = floor1.spots.find((spot) => spot.code === 'A1')!;
    expect(occupied.status).toBe('OCCUPIED');
    expect(occupied.activeSession).not.toBeNull();
    expect(occupied.activeSession?.vehicleLicensePlate).toBe('ABC1D23');
    expect(occupied.activeSession?.vehicleModel).toBe('Corolla');
    expect(occupied.activeSession?.durationMinutes).toBe(30);

    const free = floor1.spots.find((spot) => spot.code === 'A2')!;
    expect(free.status).toBe('FREE');
    expect(free.activeSession).toBeNull();

    const floor2 = view.floors.find((floor) => floor.floor === 2)!;
    expect(floor2.spots).toHaveLength(1);
  });

  it('throws ParkingLotNotFoundError when the lot does not exist', async () => {
    await expect(
      setup.usecase.execute({ parkingLotId: '00000000-0000-4000-8000-000000000000' }),
    ).rejects.toBeInstanceOf(ParkingLotNotFoundError);
  });

  it('returns an empty map when the lot has no spots', async () => {
    const lot = makeParkingLot({ name: 'Empty Lot', address: 'addr', totalCapacity: 0 });
    await setup.parkingLots.save(lot);

    const view = await setup.usecase.execute({ parkingLotId: lot.id().value() });

    expect(view.floors).toEqual([]);
    expect(view.occupancy).toEqual({ free: 0, occupied: 0, reserved: 0, total: 0 });
  });
});
