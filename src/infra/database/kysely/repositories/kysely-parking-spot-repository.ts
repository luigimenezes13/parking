import { inject, injectable } from 'inversify';
import { type Kysely } from 'kysely';

import { type UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { type ParkingSpot } from '@domain/parking/entities/parking-spot.ts';
import { type SpotCodeVO } from '@domain/parking/value-objects/spot-code-vo.ts';
import {
  type ParkingSpotPosition,
  type ParkingSpotRepository,
} from '@domain/parking/repositories/parking-spot-repository.ts';
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
    const row = this.mapper.toInsert(spot);
    const update = this.mapper.toUpdate(spot);

    await this.database
      .insertInto('parking_spots')
      .values(row)
      .onConflict((conflict) => conflict.column('id').doUpdateSet(update))
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

  async findByPosition(position: ParkingSpotPosition): Promise<ParkingSpot | null> {
    const row = await this.database
      .selectFrom('parking_spots')
      .selectAll()
      .where('parking_lot_id', '=', position.parkingLotId.value())
      .where('floor', '=', position.floor)
      .where('row', '=', position.row)
      .where('column', '=', position.column)
      .where('deactivated_at', 'is', null)
      .executeTakeFirst();

    return row ? this.mapper.toDomain(row) : null;
  }

  async findByParkingLot(parkingLotId: UniqueIdentifier): Promise<ParkingSpot[]> {
    const rows = await this.database
      .selectFrom('parking_spots')
      .selectAll()
      .where('parking_lot_id', '=', parkingLotId.value())
      .where('deactivated_at', 'is', null)
      .orderBy('floor', 'asc')
      .orderBy('row', 'asc')
      .orderBy('column', 'asc')
      .execute();

    return rows.map((row) => this.mapper.toDomain(row));
  }

  async findFreeByParkingLot(parkingLotId: UniqueIdentifier): Promise<ParkingSpot[]> {
    const rows = await this.database
      .selectFrom('parking_spots')
      .selectAll()
      .where('parking_lot_id', '=', parkingLotId.value())
      .where('status', '=', 'FREE')
      .where('deactivated_at', 'is', null)
      .execute();

    return rows.map((row) => this.mapper.toDomain(row));
  }
}
