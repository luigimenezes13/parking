import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { SpotCodeVO } from '@domain/parking/value-objects/spot-code-vo.ts';
import { makeParkingSpot } from '@domain/parking/__tests__/factories/parking-spot.factory.ts';
import { database } from '@infra/database/Connection.ts';
import { disconnectDatabase, truncateAllTables } from '@infra/database/__tests__/test-database.ts';
import { ParkingSpotMapper } from '@infra/database/kysely/mappers/parking-spot-mapper.ts';
import { KyselyParkingSpotRepository } from '@infra/database/kysely/repositories/kysely-parking-spot-repository.ts';

const PARKING_LOT_ID = UniqueIdentifier.fromExisting('11111111-1111-4111-8111-111111111111');

interface Setup {
  repository: KyselyParkingSpotRepository;
  nextColumn: () => number;
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

  const repository = new KyselyParkingSpotRepository(database, new ParkingSpotMapper());

  let column = 0;
  const nextColumn = (): number => {
    column += 1;
    return column;
  };

  return { repository, nextColumn };
}

describe('KyselyParkingSpotRepository', () => {
  let setup: Setup;

  beforeEach(async () => {
    setup = await makeSetup();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it('should persist a new ParkingSpot and retrieve it by id', async () => {
    const spot = makeParkingSpot({
      parkingLotId: PARKING_LOT_ID,
      code: 'A',
      column: setup.nextColumn(),
    });

    await setup.repository.save(spot);
    const stored = await setup.repository.findById(spot.id());

    expect(stored).not.toBeNull();
    expect(stored?.code().value()).toBe('A');
  });

  it('should update a ParkingSpot status when saving an existing entity', async () => {
    const spot = makeParkingSpot({
      parkingLotId: PARKING_LOT_ID,
      code: 'B',
      column: setup.nextColumn(),
    });
    await setup.repository.save(spot);

    spot.occupyBySession();
    await setup.repository.save(spot);

    const stored = await setup.repository.findById(spot.id());
    expect(stored?.isOccupied()).toBe(true);
  });

  it('should retrieve a ParkingSpot by parking lot and code', async () => {
    const spot = makeParkingSpot({
      parkingLotId: PARKING_LOT_ID,
      code: 'C',
      column: setup.nextColumn(),
    });
    await setup.repository.save(spot);

    const stored = await setup.repository.findByCode(PARKING_LOT_ID, SpotCodeVO.from('C'));

    expect(stored?.id().equals(spot.id())).toBe(true);
  });

  it('should return null when finding a ParkingSpot by code that does not exist', async () => {
    const stored = await setup.repository.findByCode(PARKING_LOT_ID, SpotCodeVO.from('Z'));

    expect(stored).toBeNull();
  });

  it('should list only FREE spots when filtering by parking lot', async () => {
    const free = makeParkingSpot({
      parkingLotId: PARKING_LOT_ID,
      code: 'A',
      column: setup.nextColumn(),
    });
    const occupied = makeParkingSpot({
      parkingLotId: PARKING_LOT_ID,
      code: 'B',
      column: setup.nextColumn(),
    });
    occupied.occupyBySession();
    await setup.repository.save(free);
    await setup.repository.save(occupied);

    const freeSpots = await setup.repository.findFreeByParkingLot(PARKING_LOT_ID);

    expect(freeSpots).toHaveLength(1);
    expect(freeSpots[0]?.code().value()).toBe('A');
  });
});
