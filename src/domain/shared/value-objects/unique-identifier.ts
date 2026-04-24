import { randomUUID } from 'node:crypto';

import { ValueObject } from '../value-object.ts';

export class UniqueIdentifier extends ValueObject<string> {
  private constructor(value: string) {
    super(value);
  }

  static create(): UniqueIdentifier {
    return new UniqueIdentifier(randomUUID());
  }

  static fromExisting(value: string): UniqueIdentifier {
    if (!value || value.trim().length === 0) {
      throw new Error('UniqueIdentifier cannot be empty');
    }

    return new UniqueIdentifier(value);
  }

  value(): string {
    return this.properties;
  }
}
