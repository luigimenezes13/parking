import { inject, injectable } from 'inversify';
import { type Selectable } from 'kysely';

import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { ParkingSession } from '@domain/parking/aggregates/parking-session/parking-session.ts';
import { ParkingPeriodVO } from '@domain/parking/value-objects/parking-period-vo.ts';
import { SessionStatusVO } from '@domain/parking/value-objects/session-status-vo.ts';
import { type ParkingSession as ParkingSessionRow } from '@infra/database/types/Types.ts';
import {
  type ParkingSpotMapper,
  type SelectableParkingSpot,
} from '@infra/database/kysely/mappers/parking-spot-mapper.ts';
import {
  type VehicleMapper,
  type SelectableVehicle,
} from '@infra/database/kysely/mappers/vehicle-mapper.ts';
import { TYPES } from '@app/dto/types.ts';

export type SelectableParkingSession = Pick<
  Selectable<ParkingSessionRow>,
  | 'id'
  | 'parking_lot_id'
  | 'vehicle_id'
  | 'spot_id'
  | 'status'
  | 'entry_at'
  | 'spot_released_at'
  | 'exit_at'
>;

export type InsertableParkingSessionRow = {
  id: string;
  parking_lot_id: string;
  vehicle_id: string | null;
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
  vehicle: SelectableVehicle | null;
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
    const vehicle = rows.vehicle ? this.vehicles.toDomain(rows.vehicle) : null;
    const spot = rows.spot ? this.spots.toDomain(rows.spot) : null;

    const period = ParkingPeriodVO.rehydrate(rows.session.entry_at, rows.session.exit_at);

    return new ParkingSession(
      {
        parkingLotId: UniqueIdentifier.fromExisting(rows.session.parking_lot_id),
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
    const vehicle = session.vehicle();
    const spot = session.spot();

    return {
      id: session.id().value(),
      parking_lot_id: session.parkingLotId().value(),
      vehicle_id: vehicle ? vehicle.id().value() : null,
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
  ): Omit<InsertableParkingSessionRow, 'id' | 'parking_lot_id' | 'entry_at' | 'created_at'> {
    const vehicle = session.vehicle();
    const spot = session.spot();

    return {
      vehicle_id: vehicle ? vehicle.id().value() : null,
      spot_id: spot ? spot.id().value() : null,
      status: session.status().serialize(),
      spot_released_at: session.spotReleasedAt(),
      exit_at: session.exitAt(),
      updated_at: new Date(),
    };
  }
}
