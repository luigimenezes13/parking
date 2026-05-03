import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { ParkingSpot } from '@domain/parking/entities/parking-spot.ts';
import { SpotCodeVO } from '@domain/parking/value-objects/spot-code-vo.ts';

export interface MakeParkingSpotOverrides {
  parkingLotId?: UniqueIdentifier;
  code?: SpotCodeVO | string;
  floor?: number;
  isCovered?: boolean;
}

export function makeParkingSpot(overrides: MakeParkingSpotOverrides = {}): ParkingSpot {
  const code =
    overrides.code instanceof SpotCodeVO ? overrides.code : SpotCodeVO.from(overrides.code ?? 'A');

  return ParkingSpot.register({
    parkingLotId: overrides.parkingLotId ?? UniqueIdentifier.create(),
    code,
    floor: overrides.floor ?? 1,
    isCovered: overrides.isCovered ?? true,
  });
}
