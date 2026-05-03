import { inject, injectable } from 'inversify';

import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { ParkingSession } from '@domain/parking/aggregates/parking-session/parking-session.ts';
import { ParkingPeriodVO } from '@domain/parking/value-objects/parking-period-vo.ts';
import { SessionStatusVO } from '@domain/parking/value-objects/session-status-vo.ts';
import {
  type ParkingSession as ParkingSessionRow,
  type ParkingSpot as ParkingSpotRow,
  type Vehicle as VehicleRow,
} from '@infra/database/types/Types.ts';
import { ParkingSpotMapper } from '@infra/database/kysely/mappers/parking-spot-mapper.ts';
import { VehicleMapper } from '@infra/database/kysely/mappers/vehicle-mapper.ts';
import { TYPES } from '@app/dto/types.ts';

export type InsertableParkingSessionRow = {
  id: string;
  vehicle_id: string;
  spot_id: string | null;
  status: 'ACTIVE' | 'FINISHED';
  entry_at: Date;
  spot_released_at: Date | null;
  exit_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

export interface ParkingSessionHydrationRow {
  session: Pick<
    ParkingSessionRow,
    'id' | 'vehicle_id' | 'spot_id' | 'status' | 'entry_at' | 'spot_released_at' | 'exit_at'
  >;
  vehicle: Pick<
    VehicleRow,
    'id' | 'driver_id' | 'parking_lot_id' | 'license_plate' | 'brand' | 'model' | 'color'
  >;
  spot:
    | Pick<ParkingSpotRow, 'id' | 'parking_lot_id' | 'code' | 'floor' | 'is_covered' | 'status'>
    | null;
}

@injectable()
export class ParkingSessionMapper {
  constructor(
    @inject(TYPES.VehicleMapper) private readonly vehicles: VehicleMapper,
    @inject(TYPES.ParkingSpotMapper) private readonly spots: ParkingSpotMapper,
  ) {}

  toDomain(rows: ParkingSessionHydrationRow): ParkingSession {
    const vehicle = this.vehicles.toDomain(rows.vehicle);
    const spot = rows.spot ? this.spots.toDomain(rows.spot) : null;

    const period = ParkingPeriodVO.rehydrate(
      this.toDate(rows.session.entry_at),
      rows.session.exit_at ? this.toDate(rows.session.exit_at) : null,
    );

    return new ParkingSession(
      {
        vehicle,
        spot,
        status: SessionStatusVO.fromExisting(rows.session.status),
        period,
        spotReleasedAt: rows.session.spot_released_at
          ? this.toDate(rows.session.spot_released_at)
          : null,
      },
      UniqueIdentifier.fromExisting(rows.session.id),
    );
  }

  toInsert(session: ParkingSession): InsertableParkingSessionRow {
    const now = new Date();
    const spot = session.spot();
    const exitAt = session.exitAt();
    const releasedAt = session.spotReleasedAt();

    return {
      id: session.id().value(),
      vehicle_id: session.vehicle().id().value(),
      spot_id: spot ? spot.id().value() : null,
      status: session.status().serialize(),
      entry_at: session.entryAt(),
      spot_released_at: releasedAt,
      exit_at: exitAt,
      created_at: now,
      updated_at: now,
    };
  }

  toUpdate(session: ParkingSession): Omit<InsertableParkingSessionRow, 'id' | 'vehicle_id' | 'entry_at' | 'created_at'> {
    const spot = session.spot();
    const exitAt = session.exitAt();
    const releasedAt = session.spotReleasedAt();

    return {
      spot_id: spot ? spot.id().value() : null,
      status: session.status().serialize(),
      spot_released_at: releasedAt,
      exit_at: exitAt,
      updated_at: new Date(),
    };
  }

  private toDate(value: Date | string): Date {
    return value instanceof Date ? value : new Date(value);
  }
}
