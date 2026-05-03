import { inject, injectable } from 'inversify';
import { type Kysely } from 'kysely';

import { type UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { type ParkingSpot } from '@domain/parking/entities/parking-spot.ts';
import { type SpotCodeVO } from '@domain/parking/value-objects/spot-code-vo.ts';
import { type ParkingSpotRepository } from '@domain/parking/repositories/parking-spot-repository.ts';
import { type Database } from '@infra/database/Connection.ts';
import { type ParkingSpotMapper } from '@infra/database/kysely/mappers/parking-spot-mapper.ts';
import { TYPES } from '@app/dto/types.ts';

@injectable()
export class KyselyParkingSpotRepository implements ParkingSpotRepository {
  private readonly database: Kysely<Database>;
  private readonly mapper: ParkingSpotMapper;

  constructor(
    @inject(TYPES.Database) database: Kysely<Database>,
    @inject(TYPES.ParkingSpotMapper) mapper: ParkingSpotMapper,
  ) {
    this.database = database;
    this.mapper = mapper;
  }

  async save(spot: ParkingSpot): Promise<void> {
    const insertRow = this.mapper.toInsert(spot);

    await this.database
      .insertInto('parking_spots')
      .values(insertRow)
      .onConflict((conflict) =>
        conflict.column('id').doUpdateSet({
          status: insertRow.status,
          updated_at: insertRow.updated_at,
        }),
      )
      .execute();
  }

  async findById(identifier: UniqueIdentifier): Promise<ParkingSpot | null> {
    const row = await this.database
      .selectFrom('parking_spots')
      .selectAll()
      .where('id', '=', identifier.value())
      .executeTakeFirst();

    return row ? this.mapper.toDomain(row) : null;
  }

  async findByCode(parkingLotId: UniqueIdentifier, code: SpotCodeVO): Promise<ParkingSpot | null> {
    const row = await this.database
      .selectFrom('parking_spots')
      .selectAll()
      .where('parking_lot_id', '=', parkingLotId.value())
      .where('code', '=', code.value())
      .executeTakeFirst();

    return row ? this.mapper.toDomain(row) : null;
  }

  async findFreeByParkingLot(parkingLotId: UniqueIdentifier): Promise<ParkingSpot[]> {
    const rows = await this.database
      .selectFrom('parking_spots')
      .selectAll()
      .where('parking_lot_id', '=', parkingLotId.value())
      .where('status', '=', 'FREE')
      .execute();

    return rows.map((row) => this.mapper.toDomain(row));
  }
}
