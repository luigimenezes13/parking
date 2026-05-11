import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { Vehicle } from '@domain/parking/entities/vehicle.ts';
import { LicensePlateVO } from '@domain/parking/value-objects/license-plate-vo.ts';

export interface MakeVehicleOverrides {
  parkingLotId?: UniqueIdentifier;
  licensePlate?: LicensePlateVO | string;
  brand?: string | null;
  model?: string | null;
  color?: string | null;
  driverId?: UniqueIdentifier;
}

export function makeVehicle(overrides: MakeVehicleOverrides = {}): Vehicle {
  const licensePlate =
    overrides.licensePlate instanceof LicensePlateVO
      ? overrides.licensePlate
      : LicensePlateVO.from(overrides.licensePlate ?? 'ABC1D23');

  const parkingLotId = overrides.parkingLotId ?? UniqueIdentifier.create();
  const brand = overrides.brand ?? null;
  const model = overrides.model ?? null;
  const color = overrides.color ?? null;

  if (overrides.driverId !== undefined) {
    return Vehicle.register({
      driverId: overrides.driverId,
      parkingLotId,
      licensePlate,
      brand,
      model,
      color,
    });
  }

  return Vehicle.registerAnonymous({
    parkingLotId,
    licensePlate,
    brand,
    model,
    color,
  });
}
