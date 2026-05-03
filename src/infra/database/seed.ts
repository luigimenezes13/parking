import { database } from '@infra/database/Connection.ts';
import { loadEnvironment } from '@infra/env/environment.ts';

const SPOT_DEFINITIONS: ReadonlyArray<{ id: string; code: string }> = [
  { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', code: 'A' },
  { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', code: 'B' },
];

async function seed(): Promise<void> {
  const environment = loadEnvironment();
  const parkingLotId = environment.DEFAULT_PARKING_LOT_ID;
  const now = new Date();

  await database
    .insertInto('parking_lots')
    .values({
      id: parkingLotId,
      name: 'Parking Lot Demo',
      address: 'Rua Demo, 123',
      total_capacity: 50,
      created_at: now,
      updated_at: now,
    })
    .onConflict((conflict) => conflict.column('id').doNothing())
    .execute();

  for (const spot of SPOT_DEFINITIONS) {
    await database
      .insertInto('parking_spots')
      .values({
        id: spot.id,
        parking_lot_id: parkingLotId,
        code: spot.code,
        floor: 1,
        is_covered: true,
        status: 'FREE',
        created_at: now,
        updated_at: now,
      })
      .onConflict((conflict) => conflict.columns(['parking_lot_id', 'code']).doNothing())
      .execute();
  }

  console.log(
    `Seed concluido. ParkingLot=${parkingLotId}, spots=${SPOT_DEFINITIONS.map((spot) => spot.code).join(', ')}`,
  );
}

seed()
  .catch((error: unknown) => {
    console.error('Seed falhou:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await database.destroy();
  });
