import { ValueObject } from '@domain/shared/value-object.ts';

type SessionStatusValue = 'ACTIVE' | 'FINISHED';

export class SessionStatusVO extends ValueObject<SessionStatusValue> {
  private constructor(value: SessionStatusValue) {
    super(value);
  }

  static active(): SessionStatusVO {
    return new SessionStatusVO('ACTIVE');
  }

  static finished(): SessionStatusVO {
    return new SessionStatusVO('FINISHED');
  }

  static fromExisting(value: SessionStatusValue): SessionStatusVO {
    return new SessionStatusVO(value);
  }

  isActive(): boolean {
    return this.properties === 'ACTIVE';
  }

  isFinished(): boolean {
    return this.properties === 'FINISHED';
  }

  finish(): SessionStatusVO {
    return SessionStatusVO.finished();
  }

  serialize(): SessionStatusValue {
    return this.properties;
  }
}
