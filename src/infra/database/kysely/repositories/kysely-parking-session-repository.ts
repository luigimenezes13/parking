import { inject, injectable } from 'inversify';
import { type Kysely, type Transaction } from 'kysely';

import { type UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { type LicensePlateVO } from '@domain/parking/value-objects/license-plate-vo.ts';
import { type ParkingSession } from '@domain/parking/aggregates/parking-session/parking-session.ts';
import { type ParkingSessionRepository } from '@domain/parking/repositories/parking-session-repository.ts';
import { type Database } from '@infra/database/Connection.ts';
import {
  type ParkingSessionMapper,
  type ParkingSessionHydrationRow,
} from '@infra/database/kysely/mappers/parking-session-mapper.ts';
import { type ParkingSpotMapper } from '@infra/database/kysely/mappers/parking-spot-mapper.ts';
import { TYPES } from '@app/dto/types.ts';

@injectable()
export class KyselyParkingSessionRepository implements ParkingSessionRepository {
  private readonly database: Kysely<Database>;
  private readonly sessionMapper: ParkingSessionMapper;
  private readonly spotMapper: ParkingSpotMapper;

  constructor(
    @inject(TYPES.Database) database: Kysely<Database>,
    @inject(TYPES.ParkingSessionMapper) sessionMapper: ParkingSessionMapper,
    @inject(TYPES.ParkingSpotMapper) spotMapper: ParkingSpotMapper,
  ) {
    this.database = database;
    this.sessionMapper = sessionMapper;
    this.spotMapper = spotMapper;
  }

  async save(session: ParkingSession): Promise<void> {
    const sessionRow = this.sessionMapper.toInsert(session);
    const spot = session.spot();

    await this.database.transaction().execute(async (trx) => {
      if (spot) {
        const spotUpdate = this.spotMapper.toUpdate(spot);
        await trx
          .updateTable('parking_spots')
          .set(spotUpdate)
          .where('id', '=', spot.id().value())
          .execute();
      }

      await trx
        .insertInto('parking_sessions')
        .values(sessionRow)
        .onConflict((conflict) =>
          conflict.column('id').doUpdateSet({
            spot_id: sessionRow.spot_id,
            status: sessionRow.status,
            spot_released_at: sessionRow.spot_released_at,
            exit_at: sessionRow.exit_at,
            updated_at: sessionRow.updated_at,
          }),
        )
        .execute();
    });
  }

  async findById(identifier: UniqueIdentifier): Promise<ParkingSession | null> {
    return this.queryHydratedSession((trx) =>
      this.baseSelect(trx).where('s.id', '=', identifier.value()),
    );
  }

  async findActiveByPlate(licensePlate: LicensePlateVO): Promise<ParkingSession | null> {
    return this.queryHydratedSession((trx) =>
      this.baseSelect(trx)
        .where('s.status', '=', 'ACTIVE')
        .where('v.license_plate', '=', licensePlate.value()),
    );
  }

  async findActiveBySpot(spotId: UniqueIdentifier): Promise<ParkingSession | null> {
    return this.queryHydratedSession((trx) =>
      this.baseSelect(trx).where('s.status', '=', 'ACTIVE').where('s.spot_id', '=', spotId.value()),
    );
  }

  private async queryHydratedSession(
    builder: (database: Kysely<Database>) => ReturnType<typeof this.baseSelect>,
  ): Promise<ParkingSession | null> {
    const row = await builder(this.database).executeTakeFirst();

    if (!row) {
      return null;
    }

    return this.sessionMapper.toDomain(this.toHydrationRow(row));
  }

  private baseSelect(trx: Kysely<Database> | Transaction<Database>) {
    return trx
      .selectFrom('parking_sessions as s')
      .innerJoin('vehicles as v', 'v.id', 's.vehicle_id')
      .leftJoin('parking_spots as p', 'p.id', 's.spot_id')
      .select([
        's.id as session_id',
        's.vehicle_id as session_vehicle_id',
        's.spot_id as session_spot_id',
        's.status as session_status',
        's.entry_at as session_entry_at',
        's.spot_released_at as session_spot_released_at',
        's.exit_at as session_exit_at',
        'v.id as vehicle_id',
        'v.driver_id as vehicle_driver_id',
        'v.parking_lot_id as vehicle_parking_lot_id',
        'v.license_plate as vehicle_license_plate',
        'v.brand as vehicle_brand',
        'v.model as vehicle_model',
        'v.color as vehicle_color',
        'p.id as spot_id',
        'p.parking_lot_id as spot_parking_lot_id',
        'p.code as spot_code',
        'p.floor as spot_floor',
        'p.is_covered as spot_is_covered',
        'p.status as spot_status',
      ]);
  }

  private toHydrationRow(row: HydratedRow): ParkingSessionHydrationRow {
    return {
      session: {
        id: row.session_id,
        vehicle_id: row.session_vehicle_id,
        spot_id: row.session_spot_id,
        status: row.session_status,
        entry_at: row.session_entry_at,
        spot_released_at: row.session_spot_released_at,
        exit_at: row.session_exit_at,
      },
      vehicle: {
        id: row.vehicle_id,
        driver_id: row.vehicle_driver_id,
        parking_lot_id: row.vehicle_parking_lot_id,
        license_plate: row.vehicle_license_plate,
        brand: row.vehicle_brand,
        model: row.vehicle_model,
        color: row.vehicle_color,
      },
      spot:
        row.spot_id && row.spot_parking_lot_id && row.spot_code
          ? {
              id: row.spot_id,
              parking_lot_id: row.spot_parking_lot_id,
              code: row.spot_code,
              floor: row.spot_floor as number,
              is_covered: row.spot_is_covered as boolean,
              status: row.spot_status as 'FREE' | 'OCCUPIED' | 'RESERVED',
            }
          : null,
    };
  }
}

interface HydratedRow {
  session_id: string;
  session_vehicle_id: string;
  session_spot_id: string | null;
  session_status: 'ACTIVE' | 'FINISHED';
  session_entry_at: Date;
  session_spot_released_at: Date | null;
  session_exit_at: Date | null;
  vehicle_id: string;
  vehicle_driver_id: string | null;
  vehicle_parking_lot_id: string;
  vehicle_license_plate: string;
  vehicle_brand: string | null;
  vehicle_model: string | null;
  vehicle_color: string | null;
  spot_id: string | null;
  spot_parking_lot_id: string | null;
  spot_code: string | null;
  spot_floor: number | null;
  spot_is_covered: boolean | null;
  spot_status: 'FREE' | 'OCCUPIED' | 'RESERVED' | null;
}
