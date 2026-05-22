import { ValueObject } from '@domain/shared/value-object.ts';
import { DomainError } from '@domain/shared/errors/domain-error.ts';

export class InvalidStreamUrlError extends DomainError {
  constructor(reason: string) {
    super(`Invalid stream URL: ${reason}`);
  }
}

const ALLOWED_PROTOCOLS = ['http:', 'https:'];

export class StreamUrlVO extends ValueObject<string> {
  private constructor(value: string) {
    super(value);
  }

  static from(value: string): StreamUrlVO {
    const trimmed = value?.trim() ?? '';

    if (trimmed.length === 0) {
      throw new InvalidStreamUrlError('cannot be empty');
    }

    let parsed: URL;
    try {
      parsed = new URL(trimmed);
    } catch {
      throw new InvalidStreamUrlError(`"${trimmed}" is not a valid URL`);
    }

    if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
      throw new InvalidStreamUrlError(
        `protocol "${parsed.protocol}" not allowed; expected one of ${ALLOWED_PROTOCOLS.join(', ')}`,
      );
    }

    return new StreamUrlVO(trimmed);
  }

  value(): string {
    return this.properties;
  }
}
