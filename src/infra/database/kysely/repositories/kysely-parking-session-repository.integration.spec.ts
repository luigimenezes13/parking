import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { LicensePlateVO } from '@domain/parking/value-objects/license-plate-vo.ts';
import { SpotCodeVO } from '@domain/parking/value-objects/spot-code-vo.ts';
import { SpotTypeVO } from '@domain/parking/value-objects/spot-type-vo.ts';
import { ParkingSession } from '@domain/parking/aggregates/parking-session/parking-session.ts';
import { ParkingSpot } from '@domain/parking/entities/parking-spot.ts';
import { Vehicle } from '@domain/parking/entities/vehicle.ts';
import { database } from '@infra/database/Connection.ts';
import { disconnectDatabase, truncateAllTables } from '@infra/database/__tests__/test-database.ts';
import { ParkingSessionMapper } from '@infra/database/kysely/mappers/parking-session-mapper.ts';
import { ParkingSpotMapper } from '@infra/database/kysely/mappers/parking-spot-mapper.ts';
import { VehicleMapper } from '@infra/database/kysely/mappers/vehicle-mapper.ts';
import { KyselyParkingSessionRepository } from '@infra/database/kysely/repositories/kysely-parking-session-repository.ts';
import { KyselyParkingSpotRepository } from '@infra/database/kysely/repositories/kysely-parking-spot-repository.ts';
import { KyselyVehicleRepository } from '@infra/database/kysely/repositories/kysely-vehicle-repository.ts';

const PARKING_LOT_ID = UniqueIdentifier.fromExisting('11111111-1111-4111-8111-111111111111');

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

interface RepositoryFixture {
  sessions: KyselyParkingSessionRepository;
  vehicles: KyselyVehicleRepository;
  spots: KyselyParkingSpotRepository;
}

function makeRepositories(): RepositoryFixture {
  const spotMapper = new ParkingSpotMapper();
  const vehicleMapper = new VehicleMapper();
  const sessionMapper = new ParkingSessionMapper(vehicleMapper, spotMapper);

  return {
    sessions: new KyselyParkingSessionRepository(database, sessionMapper, spotMapper),
    vehicles: new KyselyVehicleRepository(database, vehicleMapper),
    spots: new KyselyParkingSpotRepository(database, spotMapper),
  };
}

function makeAnonymousVehicle(plate: string): Vehicle {
  return Vehicle.registerAnonymous({
    parkingLotId: PARKING_LOT_ID,
    licensePlate: LicensePlateVO.from(plate),
  });
}

let nextSessionSpotColumn = 1;

function makeSpot(code: string): ParkingSpot {
  return ParkingSpot.register({
    parkingLotId: PARKING_LOT_ID,
    code: SpotCodeVO.from(code),
    floor: 1,
    row: 1,
    column: nextSessionSpotColumn++,
    isCovered: true,
    spotType: SpotTypeVO.regular(),
  });
}

function enterSession(vehicle: Vehicle | null, entryAt: Date): ParkingSession {
  const session = ParkingSession.enter({
    parkingLotId: PARKING_LOT_ID,
    vehicle,
    entryAt,
  });
  session.pullDomainEvents();
  return session;
}

describe('KyselyParkingSessionRepository', () => {
  beforeEach(async () => {
    await truncateAllTables();
    await seedDefaultParkingLot();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it('should persist a session pending spot and retrieve it by id', async () => {
    const { sessions, vehicles } = makeRepositories();
    const vehicle = makeAnonymousVehicle('ABC1D23');
    await vehicles.save(vehicle);

    const session = enterSession(vehicle, new Date('2026-04-30T10:00:00Z'));
    await sessions.save(session);

    const stored = await sessions.findById(session.id());

    expect(stored?.licensePlate()?.value()).toBe('ABC1D23');
    expect(stored?.spot()).toBeNull();
    expect(stored?.isActive()).toBe(true);
  });

  it('should retrieve an active session by license plate', async () => {
    const { sessions, vehicles } = makeRepositories();
    const vehicle = makeAnonymousVehicle('ABC1D23');
    await vehicles.save(vehicle);
    const session = enterSession(vehicle, new Date('2026-04-30T10:00:00Z'));
    await sessions.save(session);

    const stored = await sessions.findActiveByPlate(LicensePlateVO.from('ABC1D23'));

    expect(stored?.id().equals(session.id())).toBe(true);
  });

  it('should not return finished sessions when querying active by plate', async () => {
    const { sessions, vehicles } = makeRepositories();
    const vehicle = makeAnonymousVehicle('ABC1D23');
    await vehicles.save(vehicle);
    const session = enterSession(vehicle, new Date('2026-04-30T10:00:00Z'));
    session.finish({ exitAt: new Date('2026-04-30T11:00:00Z') });
    session.pullDomainEvents();
    await sessions.save(session);

    const stored = await sessions.findActiveByPlate(LicensePlateVO.from('ABC1D23'));

    expect(stored).toBeNull();
  });

  it('should update both session and spot status atomically when assigning a spot', async () => {
    const { sessions, vehicles, spots } = makeRepositories();
    const vehicle = makeAnonymousVehicle('ABC1D23');
    const spot = makeSpot('A');
    await vehicles.save(vehicle);
    await spots.save(spot);

    const session = enterSession(vehicle, new Date('2026-04-30T10:00:00Z'));
    session.assignSpot({ spot, occupiedAt: new Date('2026-04-30T10:00:30Z') });
    session.pullDomainEvents();
    await sessions.save(session);

    const storedSession = await sessions.findById(session.id());
    const storedSpot = await spots.findById(spot.id());

    expect(storedSession?.spot()?.id().equals(spot.id())).toBe(true);
    expect(storedSpot?.isOccupied()).toBe(true);
  });

  it('should retrieve an active session by spot id', async () => {
    const { sessions, vehicles, spots } = makeRepositories();
    const vehicle = makeAnonymousVehicle('ABC1D23');
    const spot = makeSpot('A');
    await vehicles.save(vehicle);
    await spots.save(spot);
    const session = enterSession(vehicle, new Date('2026-04-30T10:00:00Z'));
    session.assignSpot({ spot, occupiedAt: new Date('2026-04-30T10:00:30Z') });
    session.pullDomainEvents();
    await sessions.save(session);

    const stored = await sessions.findActiveBySpot(spot.id());

    expect(stored?.id().equals(session.id())).toBe(true);
  });

  it('should free the spot in the database when releaseSpot is persisted', async () => {
    const { sessions, vehicles, spots } = makeRepositories();
    const vehicle = makeAnonymousVehicle('ABC1D23');
    const spot = makeSpot('A');
    await vehicles.save(vehicle);
    await spots.save(spot);
    const session = enterSession(vehicle, new Date('2026-04-30T10:00:00Z'));
    session.assignSpot({ spot, occupiedAt: new Date('2026-04-30T10:00:30Z') });
    await sessions.save(session);
    session.pullDomainEvents();

    session.releaseSpot({ releasedAt: new Date('2026-04-30T11:00:00Z') });
    await sessions.save(session);

    const storedSpot = await spots.findById(spot.id());
    expect(storedSpot?.isFree()).toBe(true);
  });

  it('should hydrate a finished session preserving its spot reference for audit', async () => {
    const { sessions, vehicles, spots } = makeRepositories();
    const vehicle = makeAnonymousVehicle('ABC1D23');
    const spot = makeSpot('A');
    await vehicles.save(vehicle);
    await spots.save(spot);
    const session = enterSession(vehicle, new Date('2026-04-30T10:00:00Z'));
    session.assignSpot({ spot, occupiedAt: new Date('2026-04-30T10:00:30Z') });
    session.releaseSpot({ releasedAt: new Date('2026-04-30T11:00:00Z') });
    session.finish({ exitAt: new Date('2026-04-30T11:00:30Z') });
    session.pullDomainEvents();
    await sessions.save(session);

    const stored = await sessions.findById(session.id());
    expect(stored?.isFinished()).toBe(true);
    expect(stored?.spot()?.id().equals(spot.id())).toBe(true);
    expect(stored?.exitAt()).not.toBeNull();
  });

  it('should persist a pending session without vehicle and find it via findOldestPendingVehicle', async () => {
    const { sessions } = makeRepositories();
    const session = enterSession(null, new Date('2026-04-30T10:00:00Z'));
    await sessions.save(session);

    const stored = await sessions.findOldestPendingVehicle(PARKING_LOT_ID);

    expect(stored?.id().equals(session.id())).toBe(true);
    expect(stored?.vehicle()).toBeNull();
  });

  it('should return the oldest pending session when multiple exist for the same lot', async () => {
    const { sessions } = makeRepositories();
    const older = enterSession(null, new Date('2026-04-30T10:00:00Z'));
    const newer = enterSession(null, new Date('2026-04-30T10:30:00Z'));
    await sessions.save(older);
    await sessions.save(newer);

    const stored = await sessions.findOldestPendingVehicle(PARKING_LOT_ID);

    expect(stored?.id().equals(older.id())).toBe(true);
  });

  it('should ignore sessions that already have a vehicle when looking for pending ones', async () => {
    const { sessions, vehicles } = makeRepositories();
    const vehicle = makeAnonymousVehicle('ABC1D23');
    await vehicles.save(vehicle);
    const completed = enterSession(vehicle, new Date('2026-04-30T10:00:00Z'));
    await sessions.save(completed);

    const stored = await sessions.findOldestPendingVehicle(PARKING_LOT_ID);

    expect(stored).toBeNull();
  });

  it('should return the most recent active session for the lot', async () => {
    const { sessions, vehicles } = makeRepositories();
    const vehicleA = makeAnonymousVehicle('ABC1D23');
    const vehicleB = makeAnonymousVehicle('XYZ9K88');
    await vehicles.save(vehicleA);
    await vehicles.save(vehicleB);
    const older = enterSession(vehicleA, new Date('2026-04-30T10:00:00Z'));
    const newer = enterSession(vehicleB, new Date('2026-04-30T10:30:00Z'));
    await sessions.save(older);
    await sessions.save(newer);

    const stored = await sessions.findMostRecentActive(PARKING_LOT_ID);

    expect(stored?.id().equals(newer.id())).toBe(true);
  });
});
