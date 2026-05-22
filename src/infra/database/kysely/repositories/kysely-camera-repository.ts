import { inject, injectable } from 'inversify';
import { type Kysely } from 'kysely';

import { type UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { type Camera } from '@domain/parking/aggregates/camera/camera.ts';
import {
  type CameraRepository,
  type CameraStaleQuery,
} from '@domain/parking/repositories/camera-repository.ts';
import { type Database } from '@infra/database/Connection.ts';
import { type CameraMapper } from '@infra/database/kysely/mappers/camera-mapper.ts';
import { TYPES } from '@app/dto/types.ts';

@injectable()
export class KyselyCameraRepository implements CameraRepository {
  private readonly database: Kysely<Database>;
  private readonly mapper: CameraMapper;

  constructor(
    @inject(TYPES.Database) database: Kysely<Database>,
    @inject(TYPES.CameraMapper) mapper: CameraMapper,
  ) {
    this.database = database;
    this.mapper = mapper;
  }

  async save(camera: Camera): Promise<void> {
    const insert = this.mapper.toInsert(camera);
    const update = this.mapper.toUpdate(camera);

    await this.database
      .insertInto('cameras')
      .values(insert)
      .onConflict((conflict) => conflict.column('id').doUpdateSet(update))
      .execute();
  }

  async findById(identifier: UniqueIdentifier): Promise<Camera | null> {
    const row = await this.database
      .selectFrom('cameras')
      .selectAll()
      .where('id', '=', identifier.value())
      .executeTakeFirst();

    return row ? this.mapper.toDomain(row) : null;
  }

  async findByParkingLot(parkingLotId: UniqueIdentifier): Promise<Camera[]> {
    const rows = await this.database
      .selectFrom('cameras')
      .selectAll()
      .where('parking_lot_id', '=', parkingLotId.value())
      .where('deactivated_at', 'is', null)
      .orderBy('name', 'asc')
      .execute();

    return rows.map((row) => this.mapper.toDomain(row));
  }

  async findStaleOnline(query: CameraStaleQuery): Promise<Camera[]> {
    const rows = await this.database
      .selectFrom('cameras')
      .selectAll()
      .where('deactivated_at', 'is', null)
      .where('status', '=', 'ONLINE')
      .where((eb) =>
        eb.or([eb('last_seen_at', 'is', null), eb('last_seen_at', '<', query.staleBefore)]),
      )
      .execute();

    return rows.map((row) => this.mapper.toDomain(row));
  }
}
