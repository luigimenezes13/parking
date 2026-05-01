import { database } from '@infra/database/Connection.ts';
import { loadEnvironment } from '@infra/env/environment.ts';

const SPOT_DEFINITIONS: ReadonlyArray<{ id: string; code: string }> = [
  { id: '00000000-0000-0000-0000-0000000000a1', code: 'A' },
  { id: '00000000-0000-0000-0000-0000000000b1', code: 'B' },
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
      totalCapacity: 50,
      createdAt: now,
      updatedAt: now,
    })
    .onConflict((conflict) => conflict.column('id').doNothing())
    .execute();

  for (const spot of SPOT_DEFINITIONS) {
    await database
      .insertInto('parking_spots')
      .values({
        id: spot.id,
        parkingLotId,
        code: spot.code,
        floor: 1,
        isCovered: true,
        status: 'FREE',
        createdAt: now,
        updatedAt: now,
      })
      .onConflict((conflict) => conflict.columns(['parkingLotId', 'code']).doNothing())
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
