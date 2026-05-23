import { inject, injectable } from 'inversify';
import { sql, type Kysely } from 'kysely';

import { type UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { type ActivityEvent } from '@domain/activity/entities/activity-event.ts';
import {
  type ActivityDaySummary,
  type ActivityEventFilters,
  type ActivityEventListResult,
  type ActivityEventPagination,
  type ActivityEventRepository,
} from '@domain/activity/repositories/activity-event-repository.ts';
import { type Database } from '@infra/database/Connection.ts';
import { type ActivityEventMapper } from '@infra/database/kysely/mappers/activity-event-mapper.ts';
import { TYPES } from '@app/dto/types.ts';

@injectable()
export class KyselyActivityEventRepository implements ActivityEventRepository {
  private readonly database: Kysely<Database>;
  private readonly mapper: ActivityEventMapper;

  constructor(
    @inject(TYPES.Database) database: Kysely<Database>,
    @inject(TYPES.ActivityEventMapper) mapper: ActivityEventMapper,
  ) {
    this.database = database;
    this.mapper = mapper;
  }

  async save(event: ActivityEvent): Promise<void> {
    const row = this.mapper.toInsert(event);

    await this.database
      .insertInto('activity_events')
      .values(row)
      .onConflict((conflict) => conflict.column('id').doNothing())
      .execute();
  }

  async listByParkingLot(
    parkingLotId: UniqueIdentifier,
    filters: ActivityEventFilters,
    pagination: ActivityEventPagination,
  ): Promise<ActivityEventListResult> {
    const page = Math.max(1, Math.floor(pagination.page));
    const pageSize = Math.max(1, Math.min(200, Math.floor(pagination.pageSize)));
    const offset = (page - 1) * pageSize;

    let baseQuery = this.database
      .selectFrom('activity_events')
      .where('parking_lot_id', '=', parkingLotId.value());

    if (filters.from) {
      baseQuery = baseQuery.where('occurred_at', '>=', filters.from);
    }
    if (filters.to) {
      baseQuery = baseQuery.where('occurred_at', '<=', filters.to);
    }
    if (filters.types && filters.types.length > 0) {
      baseQuery = baseQuery.where('type', 'in', filters.types);
    }
    if (filters.spotId) {
      baseQuery = baseQuery.where('spot_id', '=', filters.spotId.value());
    }
    if (filters.vehicleId) {
      baseQuery = baseQuery.where('vehicle_id', '=', filters.vehicleId.value());
    }
    if (filters.plate) {
      const normalized = filters.plate.trim().toUpperCase();
      baseQuery = baseQuery.where(sql<boolean>`(payload ->> 'licensePlate') = ${normalized}`);
    }

    const totalRow = await baseQuery
      .select((eb) => eb.fn.countAll<string>().as('total'))
      .executeTakeFirst();

    const total = Number(totalRow?.total ?? 0);

    const rows = await baseQuery
      .selectAll()
      .orderBy('occurred_at', 'desc')
      .limit(pageSize)
      .offset(offset)
      .execute();

    return {
      items: rows.map((row) => this.mapper.toDomain(row)),
      total,
      page,
      pageSize,
    };
  }

  async summaryByDay(parkingLotId: UniqueIdentifier, date: Date): Promise<ActivityDaySummary> {
    const start = new Date(date);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);

    const rows = await this.database
      .selectFrom('activity_events')
      .select(['type', (eb) => eb.fn.countAll<string>().as('count')])
      .where('parking_lot_id', '=', parkingLotId.value())
      .where('occurred_at', '>=', start)
      .where('occurred_at', '<', end)
      .groupBy('type')
      .execute();

    const totals = new Map<string, number>();
    for (const row of rows) {
      totals.set(row.type, Number(row.count));
    }

    const get = (type: string): number => totals.get(type) ?? 0;
    const manualActions =
      get('MANUAL_FORCE_FINISH') +
      get('MANUAL_FORCE_PLATE') +
      get('SPOT_MAINTENANCE_ON') +
      get('SPOT_MAINTENANCE_OFF');

    return {
      date: start.toISOString().slice(0, 10),
      entries: get('VEHICLE_ENTERED'),
      exits: get('VEHICLE_EXITED'),
      spotsOccupied: get('SPOT_OCCUPIED'),
      spotsReleased: get('SPOT_RELEASED'),
      manualActions,
    };
  }
}
