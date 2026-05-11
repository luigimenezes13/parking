import { inject, injectable } from 'inversify';
import { type Kysely } from 'kysely';

import { type UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { type Driver } from '@domain/parking/entities/driver.ts';
import { type DriverRepository } from '@domain/parking/repositories/driver-repository.ts';
import { type Database } from '@infra/database/Connection.ts';
import { type DriverMapper } from '@infra/database/kysely/mappers/driver-mapper.ts';
import { TYPES } from '@app/dto/types.ts';

@injectable()
export class KyselyDriverRepository implements DriverRepository {
  private readonly database: Kysely<Database>;
  private readonly mapper: DriverMapper;

  constructor(
    @inject(TYPES.Database) database: Kysely<Database>,
    @inject(TYPES.DriverMapper) mapper: DriverMapper,
  ) {
    this.database = database;
    this.mapper = mapper;
  }

  async save(driver: Driver): Promise<void> {
    const row = this.mapper.toInsert(driver);
    const update = this.mapper.toUpdate(driver);

    await this.database
      .insertInto('drivers')
      .values(row)
      .onConflict((conflict) => conflict.column('id').doUpdateSet(update))
      .execute();
  }

  async findById(identifier: UniqueIdentifier): Promise<Driver | null> {
    const row = await this.database
      .selectFrom('drivers')
      .selectAll()
      .where('id', '=', identifier.value())
      .executeTakeFirst();

    return row ? this.mapper.toDomain(row) : null;
  }

  async findByCnh(cnh: string): Promise<Driver | null> {
    const row = await this.database
      .selectFrom('drivers')
      .selectAll()
      .where('cnh', '=', cnh)
      .executeTakeFirst();

    return row ? this.mapper.toDomain(row) : null;
  }

  async findByEmail(email: string): Promise<Driver | null> {
    const row = await this.database
      .selectFrom('drivers')
      .selectAll()
      .where('email', '=', email)
      .executeTakeFirst();

    return row ? this.mapper.toDomain(row) : null;
  }

  async findAll(): Promise<Driver[]> {
    const rows = await this.database
      .selectFrom('drivers')
      .selectAll()
      .where('deactivated_at', 'is', null)
      .orderBy('created_at', 'asc')
      .execute();

    return rows.map((row) => this.mapper.toDomain(row));
  }
}
