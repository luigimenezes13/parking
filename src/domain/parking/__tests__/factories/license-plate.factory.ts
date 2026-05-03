import { LicensePlateVO } from '@domain/parking/value-objects/license-plate-vo.ts';

export function makeLicensePlate(plate = 'ABC1D23'): LicensePlateVO {
  return LicensePlateVO.from(plate);
}
