import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { LicensePlateVO } from '@domain/parking/value-objects/license-plate-vo.ts';
import { makeVehicle } from '@domain/parking/__tests__/factories/vehicle.factory.ts';
import { makeParkingSpot } from '@domain/parking/__tests__/factories/parking-spot.factory.ts';
import { makeActiveSession } from '@domain/parking/__tests__/factories/parking-session.factory.ts';
import { database } from '@infra/database/Connection.ts';
import { disconnectDatabase, truncateAllTables } from '@infra/database/__tests__/test-database.ts';
import { ParkingSessionMapper } from '@infra/database/kysely/mappers/parking-session-mapper.ts';
import { ParkingSpotMapper } from '@infra/database/kysely/mappers/parking-spot-mapper.ts';
import { VehicleMapper } from '@infra/database/kysely/mappers/vehicle-mapper.ts';
import { KyselyParkingSessionRepository } from '@infra/database/kysely/repositories/kysely-parking-session-repository.ts';
import { KyselyParkingSpotRepository } from '@infra/database/kysely/repositories/kysely-parking-spot-repository.ts';
import { KyselyVehicleRepository } from '@infra/database/kysely/repositories/kysely-vehicle-repository.ts';

const PARKING_LOT_ID = UniqueIdentifier.fromExisting('11111111-1111-4111-8111-111111111111');

interface Setup {
  sessions: KyselyParkingSessionRepository;
  vehicles: KyselyVehicleRepository;
  spots: KyselyParkingSpotRepository;
}

async function seedDefaultParkingLot(): Promise<void> {
  await database
    .insertInto('parking_lots')
    .values({
      id: PARKING_LOT_ID.value(),
      name: 'Test Lot',
      address: 'Test address',
      total_capacity: 50,
      created_at: new Date(),
      updated_at: new Date(),
    })
    .execute();
}

async function makeSetup(): Promise<Setup> {
  await truncateAllTables();
  await seedDefaultParkingLot();

  const spotMapper = new ParkingSpotMapper();
  const vehicleMapper = new VehicleMapper();
  const sessionMapper = new ParkingSessionMapper(vehicleMapper, spotMapper);

  return {
    sessions: new KyselyParkingSessionRepository(database, sessionMapper, spotMapper),
    vehicles: new KyselyVehicleRepository(database, vehicleMapper),
    spots: new KyselyParkingSpotRepository(database, spotMapper),
  };
}

describe('KyselyParkingSessionRepository', () => {
  let setup: Setup;

  beforeEach(async () => {
    setup = await makeSetup();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it('should persist a session pending spot and retrieve it by id', async () => {
    const vehicle = makeVehicle({ parkingLotId: PARKING_LOT_ID, licensePlate: 'ABC1D23' });
    await setup.vehicles.save(vehicle);

    const session = makeActiveSession({
      parkingLotId: PARKING_LOT_ID,
      vehicle,
      entryAt: new Date('2026-04-30T10:00:00Z'),
    });
    await setup.sessions.save(session);

    const stored = await setup.sessions.findById(session.id());

    expect(stored?.licensePlate()?.value()).toBe('ABC1D23');
    expect(stored?.spot()).toBeNull();
    expect(stored?.isActive()).toBe(true);
  });

  it('should retrieve an active session by license plate', async () => {
    const vehicle = makeVehicle({ parkingLotId: PARKING_LOT_ID, licensePlate: 'ABC1D23' });
    await setup.vehicles.save(vehicle);
    const session = makeActiveSession({
      parkingLotId: PARKING_LOT_ID,
      vehicle,
      entryAt: new Date('2026-04-30T10:00:00Z'),
    });
    await setup.sessions.save(session);

    const stored = await setup.sessions.findActiveByPlate(LicensePlateVO.from('ABC1D23'));

    expect(stored?.id().equals(session.id())).toBe(true);
  });

  it('should not return finished sessions when querying active by plate', async () => {
    const vehicle = makeVehicle({ parkingLotId: PARKING_LOT_ID, licensePlate: 'ABC1D23' });
    await setup.vehicles.save(vehicle);
    const session = makeActiveSession({
      parkingLotId: PARKING_LOT_ID,
      vehicle,
      entryAt: new Date('2026-04-30T10:00:00Z'),
    });
    session.finish({ exitAt: new Date('2026-04-30T11:00:00Z') });
    session.pullDomainEvents();
    await setup.sessions.save(session);

    const stored = await setup.sessions.findActiveByPlate(LicensePlateVO.from('ABC1D23'));

    expect(stored).toBeNull();
  });

  it('should update both session and spot status atomically when assigning a spot', async () => {
    const vehicle = makeVehicle({ parkingLotId: PARKING_LOT_ID, licensePlate: 'ABC1D23' });
    const spot = makeParkingSpot({ parkingLotId: PARKING_LOT_ID, code: 'A' });
    await setup.vehicles.save(vehicle);
    await setup.spots.save(spot);

    const session = makeActiveSession({
      parkingLotId: PARKING_LOT_ID,
      vehicle,
      entryAt: new Date('2026-04-30T10:00:00Z'),
    });
    session.assignSpot({ spot, occupiedAt: new Date('2026-04-30T10:00:30Z') });
    session.pullDomainEvents();
    await setup.sessions.save(session);

    const storedSession = await setup.sessions.findById(session.id());
    const storedSpot = await setup.spots.findById(spot.id());

    expect(storedSession?.spot()?.id().equals(spot.id())).toBe(true);
    expect(storedSpot?.isOccupied()).toBe(true);
  });

  it('should retrieve an active session by spot id', async () => {
    const vehicle = makeVehicle({ parkingLotId: PARKING_LOT_ID, licensePlate: 'ABC1D23' });
    const spot = makeParkingSpot({ parkingLotId: PARKING_LOT_ID, code: 'A' });
    await setup.vehicles.save(vehicle);
    await setup.spots.save(spot);
    const session = makeActiveSession({
      parkingLotId: PARKING_LOT_ID,
      vehicle,
      entryAt: new Date('2026-04-30T10:00:00Z'),
    });
    session.assignSpot({ spot, occupiedAt: new Date('2026-04-30T10:00:30Z') });
    session.pullDomainEvents();
    await setup.sessions.save(session);

    const stored = await setup.sessions.findActiveBySpot(spot.id());

    expect(stored?.id().equals(session.id())).toBe(true);
  });

  it('should free the spot in the database when releaseSpot is persisted', async () => {
    const vehicle = makeVehicle({ parkingLotId: PARKING_LOT_ID, licensePlate: 'ABC1D23' });
    const spot = makeParkingSpot({ parkingLotId: PARKING_LOT_ID, code: 'A' });
    await setup.vehicles.save(vehicle);
    await setup.spots.save(spot);
    const session = makeActiveSession({
      parkingLotId: PARKING_LOT_ID,
      vehicle,
      entryAt: new Date('2026-04-30T10:00:00Z'),
    });
    session.assignSpot({ spot, occupiedAt: new Date('2026-04-30T10:00:30Z') });
    await setup.sessions.save(session);
    session.pullDomainEvents();

    session.releaseSpot({ releasedAt: new Date('2026-04-30T11:00:00Z') });
    await setup.sessions.save(session);

    const storedSpot = await setup.spots.findById(spot.id());
    expect(storedSpot?.isFree()).toBe(true);
  });

  it('should hydrate a finished session preserving its spot reference for audit', async () => {
    const vehicle = makeVehicle({ parkingLotId: PARKING_LOT_ID, licensePlate: 'ABC1D23' });
    const spot = makeParkingSpot({ parkingLotId: PARKING_LOT_ID, code: 'A' });
    await setup.vehicles.save(vehicle);
    await setup.spots.save(spot);
    const session = makeActiveSession({
      parkingLotId: PARKING_LOT_ID,
      vehicle,
      entryAt: new Date('2026-04-30T10:00:00Z'),
    });
    session.assignSpot({ spot, occupiedAt: new Date('2026-04-30T10:00:30Z') });
    session.releaseSpot({ releasedAt: new Date('2026-04-30T11:00:00Z') });
    session.finish({ exitAt: new Date('2026-04-30T11:00:30Z') });
    session.pullDomainEvents();
    await setup.sessions.save(session);

    const stored = await setup.sessions.findById(session.id());
    expect(stored?.isFinished()).toBe(true);
    expect(stored?.spot()?.id().equals(spot.id())).toBe(true);
    expect(stored?.exitAt()).not.toBeNull();
  });

  it('should persist a pending session without vehicle and find it via findOldestPendingVehicle', async () => {
    const session = makeActiveSession({
      parkingLotId: PARKING_LOT_ID,
      vehicle: null,
      entryAt: new Date('2026-04-30T10:00:00Z'),
    });
    await setup.sessions.save(session);

    const stored = await setup.sessions.findOldestPendingVehicle(PARKING_LOT_ID);

    expect(stored?.id().equals(session.id())).toBe(true);
    expect(stored?.vehicle()).toBeNull();
  });

  it('should return the oldest pending session when multiple exist for the same lot', async () => {
    const older = makeActiveSession({
      parkingLotId: PARKING_LOT_ID,
      vehicle: null,
      entryAt: new Date('2026-04-30T10:00:00Z'),
    });
    const newer = makeActiveSession({
      parkingLotId: PARKING_LOT_ID,
      vehicle: null,
      entryAt: new Date('2026-04-30T10:30:00Z'),
    });
    await setup.sessions.save(older);
    await setup.sessions.save(newer);

    const stored = await setup.sessions.findOldestPendingVehicle(PARKING_LOT_ID);

    expect(stored?.id().equals(older.id())).toBe(true);
  });

  it('should ignore sessions that already have a vehicle when looking for pending ones', async () => {
    const vehicle = makeVehicle({ parkingLotId: PARKING_LOT_ID, licensePlate: 'ABC1D23' });
    await setup.vehicles.save(vehicle);
    const completed = makeActiveSession({
      parkingLotId: PARKING_LOT_ID,
      vehicle,
      entryAt: new Date('2026-04-30T10:00:00Z'),
    });
    await setup.sessions.save(completed);

    const stored = await setup.sessions.findOldestPendingVehicle(PARKING_LOT_ID);

    expect(stored).toBeNull();
  });

  it('should return the most recent active session for the lot', async () => {
    const vehicleA = makeVehicle({ parkingLotId: PARKING_LOT_ID, licensePlate: 'ABC1D23' });
    const vehicleB = makeVehicle({ parkingLotId: PARKING_LOT_ID, licensePlate: 'XYZ9K88' });
    await setup.vehicles.save(vehicleA);
    await setup.vehicles.save(vehicleB);
    const older = makeActiveSession({
      parkingLotId: PARKING_LOT_ID,
      vehicle: vehicleA,
      entryAt: new Date('2026-04-30T10:00:00Z'),
    });
    const newer = makeActiveSession({
      parkingLotId: PARKING_LOT_ID,
      vehicle: vehicleB,
      entryAt: new Date('2026-04-30T10:30:00Z'),
    });
    await setup.sessions.save(older);
    await setup.sessions.save(newer);

    const stored = await setup.sessions.findMostRecentActive(PARKING_LOT_ID);

    expect(stored?.id().equals(newer.id())).toBe(true);
  });
});
