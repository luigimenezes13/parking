import { injectable } from 'inversify';
import { type Selectable } from 'kysely';

import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { ParkingSpot } from '@domain/parking/entities/parking-spot.ts';
import { SpotCodeVO } from '@domain/parking/value-objects/spot-code-vo.ts';
import { SpotStatusVO } from '@domain/parking/value-objects/spot-status-vo.ts';
import { type ParkingSpot as ParkingSpotRow } from '@infra/database/types/Types.ts';

export type SelectableParkingSpot = Pick<
  Selectable<ParkingSpotRow>,
  'id' | 'parking_lot_id' | 'code' | 'floor' | 'is_covered' | 'status'
>;

export type InsertableParkingSpotRow = {
  id: string;
  parking_lot_id: string;
  code: string;
  floor: number;
  is_covered: boolean;
  status: 'FREE' | 'OCCUPIED' | 'RESERVED';
  created_at: Date;
  updated_at: Date;
};

@injectable()
export class ParkingSpotMapper {
  toDomain(row: SelectableParkingSpot): ParkingSpot {
    return new ParkingSpot(
      {
        parkingLotId: UniqueIdentifier.fromExisting(row.parking_lot_id),
        code: SpotCodeVO.from(row.code),
        floor: row.floor,
        isCovered: row.is_covered,
        status: SpotStatusVO.fromExisting(row.status),
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
      is_covered: spot.isCovered(),
      status: spot.status().serialize(),
      created_at: now,
      updated_at: now,
    };
  }

  toUpdate(spot: ParkingSpot): { status: 'FREE' | 'OCCUPIED' | 'RESERVED'; updated_at: Date } {
    return {
      status: spot.status().serialize(),
      updated_at: new Date(),
    };
  }
}
