import { ValueObject } from '@domain/shared/value-object.ts';

type SpotTypeValue = 'REGULAR' | 'COMPACT' | 'LARGE' | 'MOTORCYCLE' | 'ACCESSIBLE' | 'ELECTRIC';

const ALLOWED_VALUES: ReadonlySet<SpotTypeValue> = new Set([
  'REGULAR',
  'COMPACT',
  'LARGE',
  'MOTORCYCLE',
  'ACCESSIBLE',
  'ELECTRIC',
]);

export class SpotTypeVO extends ValueObject<SpotTypeValue> {
  private constructor(value: SpotTypeValue) {
    super(value);
  }

  static regular(): SpotTypeVO {
    return new SpotTypeVO('REGULAR');
  }

  static compact(): SpotTypeVO {
    return new SpotTypeVO('COMPACT');
  }

  static large(): SpotTypeVO {
    return new SpotTypeVO('LARGE');
  }

  static motorcycle(): SpotTypeVO {
    return new SpotTypeVO('MOTORCYCLE');
  }

  static accessible(): SpotTypeVO {
    return new SpotTypeVO('ACCESSIBLE');
  }

  static electric(): SpotTypeVO {
    return new SpotTypeVO('ELECTRIC');
  }

  static fromExisting(value: SpotTypeValue): SpotTypeVO {
    if (!ALLOWED_VALUES.has(value)) {
      throw new Error(`Invalid spot type: ${value}`);
    }
    return new SpotTypeVO(value);
  }

  serialize(): SpotTypeValue {
    return this.properties;
  }
}
