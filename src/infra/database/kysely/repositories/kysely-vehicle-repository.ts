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

    await this.database
      .insertInto('vehicles')
      .values(row)
      .onConflict((conflict) =>
        conflict.column('id').doUpdateSet({
          driver_id: row.driver_id,
          brand: row.brand,
          model: row.model,
          color: row.color,
          updated_at: row.updated_at,
        }),
      )
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
      .execute();

    return rows.map((row) => this.mapper.toDomain(row));
  }
}
