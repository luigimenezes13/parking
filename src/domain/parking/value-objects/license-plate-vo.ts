import { ValueObject } from '@domain/shared/value-object.ts';
import { InvalidLicensePlateError } from '@domain/parking/errors/invalid-license-plate.ts';

const MERCOSUL_PATTERN = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;
const LEGACY_PATTERN = /^[A-Z]{3}[0-9]{4}$/;

export class LicensePlateVO extends ValueObject<string> {
  private constructor(value: string) {
    super(value);
  }

  static from(rawValue: string): LicensePlateVO {
    const normalized = LicensePlateVO.normalize(rawValue);

    if (!LicensePlateVO.isValid(normalized)) {
      throw new InvalidLicensePlateError(rawValue);
    }

    return new LicensePlateVO(normalized);
  }

  value(): string {
    return this.properties;
  }

  private static normalize(rawValue: string): string {
    return (rawValue ?? '').trim().replace(/[-\s]/g, '').toUpperCase();
  }

  private static isValid(normalized: string): boolean {
    return MERCOSUL_PATTERN.test(normalized) || LEGACY_PATTERN.test(normalized);
  }
}
