import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { Vehicle } from '@domain/parking/entities/vehicle.ts';
import { LicensePlateVO } from '@domain/parking/value-objects/license-plate-vo.ts';

export interface MakeVehicleOverrides {
  parkingLotId?: UniqueIdentifier;
  licensePlate?: LicensePlateVO | string;
  brand?: string | null;
  model?: string | null;
  color?: string | null;
}

export function makeVehicle(overrides: MakeVehicleOverrides = {}): Vehicle {
  const licensePlate =
    overrides.licensePlate instanceof LicensePlateVO
      ? overrides.licensePlate
      : LicensePlateVO.from(overrides.licensePlate ?? 'ABC1D23');

  return Vehicle.registerAnonymous({
    parkingLotId: overrides.parkingLotId ?? UniqueIdentifier.create(),
    licensePlate,
    brand: overrides.brand ?? null,
    model: overrides.model ?? null,
    color: overrides.color ?? null,
  });
}
