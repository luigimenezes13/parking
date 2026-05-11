import { injectable } from 'inversify';
import { type Selectable } from 'kysely';

import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { ParkingLot } from '@domain/parking/entities/parking-lot.ts';
import { type ParkingLot as ParkingLotRow } from '@infra/database/types/Types.ts';

export type SelectableParkingLot = Pick<
  Selectable<ParkingLotRow>,
  'id' | 'name' | 'address' | 'total_capacity' | 'deactivated_at'
>;

export type InsertableParkingLotRow = {
  id: string;
  name: string;
  address: string;
  total_capacity: number;
  created_at: Date;
  updated_at: Date;
  deactivated_at: Date | null;
};

@injectable()
export class ParkingLotMapper {
  toDomain(row: SelectableParkingLot): ParkingLot {
    return new ParkingLot(
      {
        name: row.name,
        address: row.address,
        totalCapacity: row.total_capacity,
        deactivatedAt: row.deactivated_at,
      },
      UniqueIdentifier.fromExisting(row.id),
    );
  }

  toInsert(parkingLot: ParkingLot): InsertableParkingLotRow {
    const now = new Date();

    return {
      id: parkingLot.id().value(),
      name: parkingLot.name(),
      address: parkingLot.address(),
      total_capacity: parkingLot.totalCapacity(),
      created_at: now,
      updated_at: now,
      deactivated_at: parkingLot.deactivatedAt(),
    };
  }

  toUpdate(parkingLot: ParkingLot): {
    name: string;
    address: string;
    total_capacity: number;
    deactivated_at: Date | null;
    updated_at: Date;
  } {
    return {
      name: parkingLot.name(),
      address: parkingLot.address(),
      total_capacity: parkingLot.totalCapacity(),
      deactivated_at: parkingLot.deactivatedAt(),
      updated_at: new Date(),
    };
  }
}
