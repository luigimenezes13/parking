import { ValueObject } from '@domain/shared/value-object.ts';

type CameraStatusValue = 'ONLINE' | 'OFFLINE' | 'UNREGISTERED';

export class CameraStatusVO extends ValueObject<CameraStatusValue> {
  private constructor(value: CameraStatusValue) {
    super(value);
  }

  static online(): CameraStatusVO {
    return new CameraStatusVO('ONLINE');
  }

  static offline(): CameraStatusVO {
    return new CameraStatusVO('OFFLINE');
  }

  static unregistered(): CameraStatusVO {
    return new CameraStatusVO('UNREGISTERED');
  }

  static fromExisting(value: CameraStatusValue): CameraStatusVO {
    return new CameraStatusVO(value);
  }

  isOnline(): boolean {
    return this.properties === 'ONLINE';
  }

  isOffline(): boolean {
    return this.properties === 'OFFLINE';
  }

  isUnregistered(): boolean {
    return this.properties === 'UNREGISTERED';
  }

  serialize(): CameraStatusValue {
    return this.properties;
  }
}
