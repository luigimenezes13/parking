import { ValueObject } from '@domain/shared/value-object.ts';
import { InvalidSpotCodeError } from '@domain/parking/errors/invalid-spot-code.ts';

const SPOT_CODE_PATTERN = /^[A-Z0-9][A-Z0-9-]{0,15}$/;

export class SpotCodeVO extends ValueObject<string> {
  private constructor(value: string) {
    super(value);
  }

  static from(rawValue: string): SpotCodeVO {
    const normalized = (rawValue ?? '').trim().toUpperCase();

    if (!SPOT_CODE_PATTERN.test(normalized)) {
      throw new InvalidSpotCodeError(rawValue);
    }

    return new SpotCodeVO(normalized);
  }

  value(): string {
    return this.properties;
  }
}
