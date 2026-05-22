import { ValueObject } from '@domain/shared/value-object.ts';
import { DomainError } from '@domain/shared/errors/domain-error.ts';

const MIN_LENGTH = 2;
const MAX_LENGTH = 80;

export class InvalidCameraNameError extends DomainError {
  constructor(reason: string) {
    super(`Invalid camera name: ${reason}`);
  }
}

export class CameraNameVO extends ValueObject<string> {
  private constructor(value: string) {
    super(value);
  }

  static from(value: string): CameraNameVO {
    const trimmed = value?.trim() ?? '';

    if (trimmed.length < MIN_LENGTH) {
      throw new InvalidCameraNameError(`must have at least ${MIN_LENGTH} characters`);
    }

    if (trimmed.length > MAX_LENGTH) {
      throw new InvalidCameraNameError(`must have at most ${MAX_LENGTH} characters`);
    }

    return new CameraNameVO(trimmed);
  }

  value(): string {
    return this.properties;
  }
}
