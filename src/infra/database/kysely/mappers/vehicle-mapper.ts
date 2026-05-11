import { injectable } from 'inversify';
import { type Selectable } from 'kysely';

import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { Vehicle } from '@domain/parking/entities/vehicle.ts';
import { LicensePlateVO } from '@domain/parking/value-objects/license-plate-vo.ts';
import { type Vehicle as VehicleRow } from '@infra/database/types/Types.ts';

export type SelectableVehicle = Pick<
  Selectable<VehicleRow>,
  | 'id'
  | 'driver_id'
  | 'parking_lot_id'
  | 'license_plate'
  | 'brand'
  | 'model'
  | 'color'
  | 'deactivated_at'
>;

export type InsertableVehicleRow = {
  id: string;
  driver_id: string | null;
  parking_lot_id: string;
  license_plate: string;
  brand: string | null;
  model: string | null;
  color: string | null;
  created_at: Date;
  updated_at: Date;
  deactivated_at: Date | null;
};

@injectable()
export class VehicleMapper {
  toDomain(row: SelectableVehicle): Vehicle {
    return new Vehicle(
      {
        driverId: row.driver_id ? UniqueIdentifier.fromExisting(row.driver_id) : null,
        parkingLotId: UniqueIdentifier.fromExisting(row.parking_lot_id),
        licensePlate: LicensePlateVO.from(row.license_plate),
        brand: row.brand,
        model: row.model,
        color: row.color,
        deactivatedAt: row.deactivated_at,
      },
      UniqueIdentifier.fromExisting(row.id),
    );
  }

  toInsert(vehicle: Vehicle): InsertableVehicleRow {
    const now = new Date();

    return {
      id: vehicle.id().value(),
      driver_id: vehicle.driverId()?.value() ?? null,
      parking_lot_id: vehicle.parkingLotId().value(),
      license_plate: vehicle.licensePlate().value(),
      brand: vehicle.brand(),
      model: vehicle.model(),
      color: vehicle.color(),
      created_at: now,
      updated_at: now,
      deactivated_at: vehicle.deactivatedAt(),
    };
  }

  toUpdate(vehicle: Vehicle): {
    driver_id: string | null;
    brand: string | null;
    model: string | null;
    color: string | null;
    deactivated_at: Date | null;
    updated_at: Date;
  } {
    return {
      driver_id: vehicle.driverId()?.value() ?? null,
      brand: vehicle.brand(),
      model: vehicle.model(),
      color: vehicle.color(),
      deactivated_at: vehicle.deactivatedAt(),
      updated_at: new Date(),
    };
  }
}
