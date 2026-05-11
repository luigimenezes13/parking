import { injectable } from 'inversify';
import { type Selectable } from 'kysely';

import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { Driver } from '@domain/parking/entities/driver.ts';
import { type Driver as DriverRow } from '@infra/database/types/Types.ts';

export type SelectableDriver = Pick<
  Selectable<DriverRow>,
  'id' | 'cnh' | 'name' | 'email' | 'phone' | 'deactivated_at'
>;

export type InsertableDriverRow = {
  id: string;
  cnh: string;
  name: string;
  email: string;
  phone: string;
  created_at: Date;
  updated_at: Date;
  deactivated_at: Date | null;
};

@injectable()
export class DriverMapper {
  toDomain(row: SelectableDriver): Driver {
    return new Driver(
      {
        cnh: row.cnh,
        name: row.name,
        email: row.email,
        phone: row.phone,
        deactivatedAt: row.deactivated_at,
      },
      UniqueIdentifier.fromExisting(row.id),
    );
  }

  toInsert(driver: Driver): InsertableDriverRow {
    const now = new Date();

    return {
      id: driver.id().value(),
      cnh: driver.cnh(),
      name: driver.name(),
      email: driver.email(),
      phone: driver.phone(),
      created_at: now,
      updated_at: now,
      deactivated_at: driver.deactivatedAt(),
    };
  }

  toUpdate(driver: Driver): {
    name: string;
    email: string;
    phone: string;
    deactivated_at: Date | null;
    updated_at: Date;
  } {
    return {
      name: driver.name(),
      email: driver.email(),
      phone: driver.phone(),
      deactivated_at: driver.deactivatedAt(),
      updated_at: new Date(),
    };
  }
}
