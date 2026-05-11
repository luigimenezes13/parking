import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { LicensePlateVO } from '@domain/parking/value-objects/license-plate-vo.ts';
import { makeVehicle } from '@domain/parking/__tests__/factories/vehicle.factory.ts';
import { database } from '@infra/database/Connection.ts';
import { disconnectDatabase, truncateAllTables } from '@infra/database/__tests__/test-database.ts';
import { VehicleMapper } from '@infra/database/kysely/mappers/vehicle-mapper.ts';
import { KyselyVehicleRepository } from '@infra/database/kysely/repositories/kysely-vehicle-repository.ts';

const PARKING_LOT_ID = UniqueIdentifier.fromExisting('11111111-1111-4111-8111-111111111111');

interface Setup {
  repository: KyselyVehicleRepository;
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

  const repository = new KyselyVehicleRepository(database, new VehicleMapper());
  return { repository };
}

describe('KyselyVehicleRepository', () => {
  let setup: Setup;

  beforeEach(async () => {
    setup = await makeSetup();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it('should persist an anonymous vehicle without a driver', async () => {
    const vehicle = makeVehicle({ parkingLotId: PARKING_LOT_ID, licensePlate: 'ABC1D23' });

    await setup.repository.save(vehicle);
    const stored = await setup.repository.findById(vehicle.id());

    expect(stored?.licensePlate().value()).toBe('ABC1D23');
    expect(stored?.driverId()).toBeNull();
  });

  it('should retrieve a Vehicle by license plate', async () => {
    const vehicle = makeVehicle({ parkingLotId: PARKING_LOT_ID, licensePlate: 'XYZ9K88' });
    await setup.repository.save(vehicle);

    const stored = await setup.repository.findByLicensePlate(LicensePlateVO.from('XYZ9K88'));

    expect(stored?.id().equals(vehicle.id())).toBe(true);
  });

  it('should return null when looking up a license plate that was not stored', async () => {
    const stored = await setup.repository.findByLicensePlate(LicensePlateVO.from('NOT9P99'));

    expect(stored).toBeNull();
  });

  it('should update the driver when saving a vehicle that already exists', async () => {
    const vehicle = makeVehicle({ parkingLotId: PARKING_LOT_ID, licensePlate: 'AAA1B22' });
    await setup.repository.save(vehicle);

    const driverId = UniqueIdentifier.fromExisting('22222222-2222-4222-8222-222222222222');
    await database
      .insertInto('drivers')
      .values({
        id: driverId.value(),
        cnh: '12345678901',
        name: 'Test Driver',
        email: 'driver@test.com',
        phone: '11999999999',
        created_at: new Date(),
        updated_at: new Date(),
      })
      .execute();

    vehicle.transferOwnershipTo(driverId);
    await setup.repository.save(vehicle);

    const stored = await setup.repository.findById(vehicle.id());
    expect(stored?.driverId()?.value()).toBe(driverId.value());
  });
});
