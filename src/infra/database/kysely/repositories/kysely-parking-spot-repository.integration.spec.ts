import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { SpotCodeVO } from '@domain/parking/value-objects/spot-code-vo.ts';
import { SpotTypeVO } from '@domain/parking/value-objects/spot-type-vo.ts';
import { ParkingSpot } from '@domain/parking/entities/parking-spot.ts';
import { database } from '@infra/database/Connection.ts';
import { disconnectDatabase, truncateAllTables } from '@infra/database/__tests__/test-database.ts';
import { ParkingSpotMapper } from '@infra/database/kysely/mappers/parking-spot-mapper.ts';
import { KyselyParkingSpotRepository } from '@infra/database/kysely/repositories/kysely-parking-spot-repository.ts';

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

function makeRepository(): KyselyParkingSpotRepository {
  return new KyselyParkingSpotRepository(database, new ParkingSpotMapper());
}

let nextColumn = 1;

function makeSpot(code = 'A'): ParkingSpot {
  return ParkingSpot.register({
    parkingLotId: PARKING_LOT_ID,
    code: SpotCodeVO.from(code),
    floor: 1,
    row: 1,
    column: nextColumn++,
    isCovered: true,
    spotType: SpotTypeVO.regular(),
  });
}

describe('KyselyParkingSpotRepository', () => {
  beforeEach(async () => {
    await truncateAllTables();
    await seedDefaultParkingLot();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it('should persist a new ParkingSpot and retrieve it by id', async () => {
    const repository = makeRepository();
    const spot = makeSpot('A');

    await repository.save(spot);
    const stored = await repository.findById(spot.id());

    expect(stored).not.toBeNull();
    expect(stored?.code().value()).toBe('A');
  });

  it('should update a ParkingSpot status when saving an existing entity', async () => {
    const repository = makeRepository();
    const spot = makeSpot('B');
    await repository.save(spot);

    spot.occupyBySession();
    await repository.save(spot);

    const stored = await repository.findById(spot.id());
    expect(stored?.isOccupied()).toBe(true);
  });

  it('should retrieve a ParkingSpot by parking lot and code', async () => {
    const repository = makeRepository();
    const spot = makeSpot('C');
    await repository.save(spot);

    const stored = await repository.findByCode(PARKING_LOT_ID, SpotCodeVO.from('C'));

    expect(stored?.id().equals(spot.id())).toBe(true);
  });

  it('should return null when finding a ParkingSpot by code that does not exist', async () => {
    const repository = makeRepository();

    const stored = await repository.findByCode(PARKING_LOT_ID, SpotCodeVO.from('Z'));

    expect(stored).toBeNull();
  });

  it('should list only FREE spots when filtering by parking lot', async () => {
    const repository = makeRepository();
    const free = makeSpot('A');
    const occupied = makeSpot('B');
    occupied.occupyBySession();
    await repository.save(free);
    await repository.save(occupied);

    const freeSpots = await repository.findFreeByParkingLot(PARKING_LOT_ID);

    expect(freeSpots).toHaveLength(1);
    expect(freeSpots[0]?.code().value()).toBe('A');
  });
});
