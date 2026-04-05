import { randomUUID } from 'node:crypto';

import { ValueObject } from '../value-object.ts';

interface UniqueIdentifierProperties {
  value: string;
}

export class UniqueIdentifier extends ValueObject<UniqueIdentifierProperties> {
  private constructor(properties: UniqueIdentifierProperties) {
    super(properties);
  }

  static create(): UniqueIdentifier {
    return new UniqueIdentifier({ value: randomUUID() });
  }

  static fromExisting(value: string): UniqueIdentifier {
    if (!value || value.trim().length === 0) {
      throw new Error('UniqueIdentifier cannot be empty');
    }

    return new UniqueIdentifier({ value });
  }

  value(): string {
    return this.properties.value;
  }
}
