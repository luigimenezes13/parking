import { inject, injectable } from 'inversify';
import { type Kysely } from 'kysely';

import { type UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { type Vehicle } from '@domain/parking/entities/vehicle.ts';
import { type LicensePlateVO } from '@domain/parking/value-objects/license-plate-vo.ts';
import { type VehicleRepository } from '@domain/parking/repositories/vehicle-repository.ts';
import { type Database } from '@infra/database/Connection.ts';
import { type VehicleMapper } from '@infra/database/kysely/mappers/vehicle-mapper.ts';
import { TYPES } from '@app/dto/types.ts';

@injectable()
export class KyselyVehicleRepository implements VehicleRepository {
  private readonly database: Kysely<Database>;
  private readonly mapper: VehicleMapper;

  constructor(
    @inject(TYPES.Database) database: Kysely<Database>,
    @inject(TYPES.VehicleMapper) mapper: VehicleMapper,
  ) {
    this.database = database;
    this.mapper = mapper;
  }

  async save(vehicle: Vehicle): Promise<void> {
    const row = this.mapper.toInsert(vehicle);
    const update = this.mapper.toUpdate(vehicle);

    await this.database
      .insertInto('vehicles')
      .values(row)
      .onConflict((conflict) => conflict.column('id').doUpdateSet(update))
      .execute();
  }

  async findById(identifier: UniqueIdentifier): Promise<Vehicle | null> {
    const row = await this.database
      .selectFrom('vehicles')
      .selectAll()
      .where('id', '=', identifier.value())
      .executeTakeFirst();

    return row ? this.mapper.toDomain(row) : null;
  }

  async findByLicensePlate(licensePlate: LicensePlateVO): Promise<Vehicle | null> {
    const row = await this.database
      .selectFrom('vehicles')
      .selectAll()
      .where('license_plate', '=', licensePlate.value())
      .executeTakeFirst();

    return row ? this.mapper.toDomain(row) : null;
  }

  async findByDriverId(driverId: UniqueIdentifier): Promise<Vehicle[]> {
    const rows = await this.database
      .selectFrom('vehicles')
      .selectAll()
      .where('driver_id', '=', driverId.value())
      .where('deactivated_at', 'is', null)
      .orderBy('created_at', 'asc')
      .execute();

    return rows.map((row) => this.mapper.toDomain(row));
  }

  async findByParkingLotId(parkingLotId: UniqueIdentifier): Promise<Vehicle[]> {
    const rows = await this.database
      .selectFrom('vehicles')
      .selectAll()
      .where('parking_lot_id', '=', parkingLotId.value())
      .where('deactivated_at', 'is', null)
      .orderBy('created_at', 'asc')
      .execute();

    return rows.map((row) => this.mapper.toDomain(row));
  }

  async findAll(): Promise<Vehicle[]> {
    const rows = await this.database
      .selectFrom('vehicles')
      .selectAll()
      .where('deactivated_at', 'is', null)
      .orderBy('created_at', 'asc')
      .execute();

    return rows.map((row) => this.mapper.toDomain(row));
  }
}
