import { inject, injectable } from 'inversify';
import { type Selectable } from 'kysely';

import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { ParkingSession } from '@domain/parking/aggregates/parking-session/parking-session.ts';
import { ParkingPeriodVO } from '@domain/parking/value-objects/parking-period-vo.ts';
import { SessionStatusVO } from '@domain/parking/value-objects/session-status-vo.ts';
import { type ParkingSession as ParkingSessionRow } from '@infra/database/types/Types.ts';
import {
  ParkingSpotMapper,
  type SelectableParkingSpot,
} from '@infra/database/kysely/mappers/parking-spot-mapper.ts';
import {
  VehicleMapper,
  type SelectableVehicle,
} from '@infra/database/kysely/mappers/vehicle-mapper.ts';
import { TYPES } from '@app/dto/types.ts';

export type SelectableParkingSession = Pick<
  Selectable<ParkingSessionRow>,
  'id' | 'vehicle_id' | 'spot_id' | 'status' | 'entry_at' | 'spot_released_at' | 'exit_at'
>;

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
  session: SelectableParkingSession;
  vehicle: SelectableVehicle;
  spot: SelectableParkingSpot | null;
}

@injectable()
export class ParkingSessionMapper {
  private readonly vehicles: VehicleMapper;
  private readonly spots: ParkingSpotMapper;

  constructor(
    @inject(TYPES.VehicleMapper) vehicles: VehicleMapper,
    @inject(TYPES.ParkingSpotMapper) spots: ParkingSpotMapper,
  ) {
    this.vehicles = vehicles;
    this.spots = spots;
  }

  toDomain(rows: ParkingSessionHydrationRow): ParkingSession {
    const vehicle = this.vehicles.toDomain(rows.vehicle);
    const spot = rows.spot ? this.spots.toDomain(rows.spot) : null;

    const period = ParkingPeriodVO.rehydrate(
      rows.session.entry_at,
      rows.session.exit_at,
    );

    return new ParkingSession(
      {
        vehicle,
        spot,
        status: SessionStatusVO.fromExisting(rows.session.status),
        period,
        spotReleasedAt: rows.session.spot_released_at,
      },
      UniqueIdentifier.fromExisting(rows.session.id),
    );
  }

  toInsert(session: ParkingSession): InsertableParkingSessionRow {
    const now = new Date();
    const spot = session.spot();

    return {
      id: session.id().value(),
      vehicle_id: session.vehicle().id().value(),
      spot_id: spot ? spot.id().value() : null,
      status: session.status().serialize(),
      entry_at: session.entryAt(),
      spot_released_at: session.spotReleasedAt(),
      exit_at: session.exitAt(),
      created_at: now,
      updated_at: now,
    };
  }

  toUpdate(
    session: ParkingSession,
  ): Omit<InsertableParkingSessionRow, 'id' | 'vehicle_id' | 'entry_at' | 'created_at'> {
    const spot = session.spot();

    return {
      spot_id: spot ? spot.id().value() : null,
      status: session.status().serialize(),
      spot_released_at: session.spotReleasedAt(),
      exit_at: session.exitAt(),
      updated_at: new Date(),
    };
  }
}
