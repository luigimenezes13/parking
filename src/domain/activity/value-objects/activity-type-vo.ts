import { ValueObject } from '@domain/shared/value-object.ts';
import { DomainError } from '@domain/shared/errors/domain-error.ts';

export type ActivityTypeValue =
  | 'VEHICLE_ENTERED'
  | 'SPOT_OCCUPIED'
  | 'SPOT_RELEASED'
  | 'VEHICLE_EXITED'
  | 'SESSION_STARTED'
  | 'SESSION_FINISHED'
  | 'MANUAL_FORCE_FINISH'
  | 'MANUAL_FORCE_PLATE'
  | 'SPOT_MAINTENANCE_ON'
  | 'SPOT_MAINTENANCE_OFF'
  | 'CAMERA_ONLINE'
  | 'CAMERA_OFFLINE';

const ALL_TYPES: ReadonlyArray<ActivityTypeValue> = [
  'VEHICLE_ENTERED',
  'SPOT_OCCUPIED',
  'SPOT_RELEASED',
  'VEHICLE_EXITED',
  'SESSION_STARTED',
  'SESSION_FINISHED',
  'MANUAL_FORCE_FINISH',
  'MANUAL_FORCE_PLATE',
  'SPOT_MAINTENANCE_ON',
  'SPOT_MAINTENANCE_OFF',
  'CAMERA_ONLINE',
  'CAMERA_OFFLINE',
];

export class InvalidActivityTypeError extends DomainError {
  constructor(value: string) {
    super(`Invalid activity type: ${value}`);
  }
}

export class ActivityTypeVO extends ValueObject<ActivityTypeValue> {
  private constructor(value: ActivityTypeValue) {
    super(value);
  }

  static from(value: string): ActivityTypeVO {
    if (!ALL_TYPES.includes(value as ActivityTypeValue)) {
      throw new InvalidActivityTypeError(value);
    }
    return new ActivityTypeVO(value as ActivityTypeValue);
  }

  static all(): ReadonlyArray<ActivityTypeValue> {
    return ALL_TYPES;
  }

  serialize(): ActivityTypeValue {
    return this.properties;
  }
}
