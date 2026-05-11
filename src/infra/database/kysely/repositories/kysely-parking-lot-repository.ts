import { inject, injectable } from 'inversify';
import { type Kysely } from 'kysely';

import { type UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { type ParkingLot } from '@domain/parking/entities/parking-lot.ts';
import { type ParkingLotRepository } from '@domain/parking/repositories/parking-lot-repository.ts';
import { type Database } from '@infra/database/Connection.ts';
import { type ParkingLotMapper } from '@infra/database/kysely/mappers/parking-lot-mapper.ts';
import { TYPES } from '@app/dto/types.ts';

@injectable()
export class KyselyParkingLotRepository implements ParkingLotRepository {
  private readonly database: Kysely<Database>;
  private readonly mapper: ParkingLotMapper;

  constructor(
    @inject(TYPES.Database) database: Kysely<Database>,
    @inject(TYPES.ParkingLotMapper) mapper: ParkingLotMapper,
  ) {
    this.database = database;
    this.mapper = mapper;
  }

  async save(parkingLot: ParkingLot): Promise<void> {
    const row = this.mapper.toInsert(parkingLot);
    const update = this.mapper.toUpdate(parkingLot);

    await this.database
      .insertInto('parking_lots')
      .values(row)
      .onConflict((conflict) => conflict.column('id').doUpdateSet(update))
      .execute();
  }

  async findById(identifier: UniqueIdentifier): Promise<ParkingLot | null> {
    const row = await this.database
      .selectFrom('parking_lots')
      .selectAll()
      .where('id', '=', identifier.value())
      .executeTakeFirst();

    return row ? this.mapper.toDomain(row) : null;
  }

  async findAll(): Promise<ParkingLot[]> {
    const rows = await this.database
      .selectFrom('parking_lots')
      .selectAll()
      .where('deactivated_at', 'is', null)
      .orderBy('created_at', 'asc')
      .execute();

    return rows.map((row) => this.mapper.toDomain(row));
  }
}
