import { describe, expect, it } from 'vitest';

import { LicensePlateVO } from '@domain/parking/value-objects/license-plate-vo.ts';
import { InvalidLicensePlateError } from '@domain/parking/errors/invalid-license-plate.ts';

describe('LicensePlateVO', () => {
  it('should accept a valid Mercosul plate (AAA0A00)', () => {
    expect(LicensePlateVO.from('ABC1D23').value()).toBe('ABC1D23');
  });

  it('should accept a valid legacy Brazilian plate (AAA0000)', () => {
    expect(LicensePlateVO.from('ABC1234').value()).toBe('ABC1234');
  });

  it('should normalize lowercase to uppercase', () => {
    expect(LicensePlateVO.from('abc1d23').value()).toBe('ABC1D23');
  });

  it('should strip whitespace and dashes before validating', () => {
    expect(LicensePlateVO.from(' abc-1d23 ').value()).toBe('ABC1D23');
  });

  it('should throw InvalidLicensePlateError for plate with wrong length', () => {
    expect(() => LicensePlateVO.from('AB1234')).toThrow(InvalidLicensePlateError);
  });

  it('should throw InvalidLicensePlateError for plate with special characters', () => {
    expect(() => LicensePlateVO.from('AB!1234')).toThrow(InvalidLicensePlateError);
  });

  it('should throw InvalidLicensePlateError for empty string', () => {
    expect(() => LicensePlateVO.from('')).toThrow(InvalidLicensePlateError);
  });

  it('should throw InvalidLicensePlateError for format outside Brazilian standards', () => {
    expect(() => LicensePlateVO.from('1234ABC')).toThrow(InvalidLicensePlateError);
  });

  it('should treat plates with same normalized value as equal', () => {
    expect(LicensePlateVO.from('abc-1d23').equals(LicensePlateVO.from('ABC1D23'))).toBe(true);
  });

  it('should treat plates with different values as not equal', () => {
    expect(LicensePlateVO.from('ABC1D23').equals(LicensePlateVO.from('XYZ9K88'))).toBe(false);
  });
});
