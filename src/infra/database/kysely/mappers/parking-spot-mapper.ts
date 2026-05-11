import { injectable } from 'inversify';
import { type Selectable } from 'kysely';

import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { ParkingSpot } from '@domain/parking/entities/parking-spot.ts';
import { SpotCodeVO } from '@domain/parking/value-objects/spot-code-vo.ts';
import { SpotStatusVO } from '@domain/parking/value-objects/spot-status-vo.ts';
import { SpotTypeVO } from '@domain/parking/value-objects/spot-type-vo.ts';
import { type ParkingSpot as ParkingSpotRow } from '@infra/database/types/Types.ts';

type SpotTypeValue = 'REGULAR' | 'COMPACT' | 'LARGE' | 'MOTORCYCLE' | 'ACCESSIBLE' | 'ELECTRIC';

export type SelectableParkingSpot = Pick<
  Selectable<ParkingSpotRow>,
  | 'id'
  | 'parking_lot_id'
  | 'code'
  | 'floor'
  | 'row'
  | 'column'
  | 'is_covered'
  | 'spot_type'
  | 'status'
  | 'deactivated_at'
>;

export type InsertableParkingSpotRow = {
  id: string;
  parking_lot_id: string;
  code: string;
  floor: number;
  row: number;
  column: number;
  is_covered: boolean;
  spot_type: SpotTypeValue;
  status: 'FREE' | 'OCCUPIED' | 'RESERVED';
  created_at: Date;
  updated_at: Date;
  deactivated_at: Date | null;
};

@injectable()
export class ParkingSpotMapper {
  toDomain(row: SelectableParkingSpot): ParkingSpot {
    return new ParkingSpot(
      {
        parkingLotId: UniqueIdentifier.fromExisting(row.parking_lot_id),
        code: SpotCodeVO.from(row.code),
        floor: row.floor,
        row: row.row,
        column: row.column,
        isCovered: row.is_covered,
        spotType: SpotTypeVO.fromExisting(row.spot_type),
        status: SpotStatusVO.fromExisting(row.status),
        deactivatedAt: row.deactivated_at,
      },
      UniqueIdentifier.fromExisting(row.id),
    );
  }

  toInsert(spot: ParkingSpot): InsertableParkingSpotRow {
    const now = new Date();

    return {
      id: spot.id().value(),
      parking_lot_id: spot.parkingLotId().value(),
      code: spot.code().value(),
      floor: spot.floor(),
      row: spot.row(),
      column: spot.column(),
      is_covered: spot.isCovered(),
      spot_type: spot.spotType().serialize(),
      status: spot.status().serialize(),
      created_at: now,
      updated_at: now,
      deactivated_at: spot.deactivatedAt(),
    };
  }

  toUpdate(spot: ParkingSpot): {
    floor: number;
    row: number;
    column: number;
    is_covered: boolean;
    spot_type: SpotTypeValue;
    status: 'FREE' | 'OCCUPIED' | 'RESERVED';
    deactivated_at: Date | null;
    updated_at: Date;
  } {
    return {
      floor: spot.floor(),
      row: spot.row(),
      column: spot.column(),
      is_covered: spot.isCovered(),
      spot_type: spot.spotType().serialize(),
      status: spot.status().serialize(),
      deactivated_at: spot.deactivatedAt(),
      updated_at: new Date(),
    };
  }
}
