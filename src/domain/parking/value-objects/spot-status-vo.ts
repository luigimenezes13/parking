import { ValueObject } from '@domain/shared/value-object.ts';
import { SpotNotFreeError } from '@domain/parking/errors/spot-not-free.ts';
import { SpotNotOccupiedError } from '@domain/parking/errors/spot-not-occupied.ts';
import { SpotNotUnderMaintenanceError } from '@domain/parking/errors/spot-not-under-maintenance.ts';

type SpotStatusValue = 'FREE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE';

export class SpotStatusVO extends ValueObject<SpotStatusValue> {
  private constructor(value: SpotStatusValue) {
    super(value);
  }

  static free(): SpotStatusVO {
    return new SpotStatusVO('FREE');
  }

  static occupied(): SpotStatusVO {
    return new SpotStatusVO('OCCUPIED');
  }

  static reserved(): SpotStatusVO {
    return new SpotStatusVO('RESERVED');
  }

  static maintenance(): SpotStatusVO {
    return new SpotStatusVO('MAINTENANCE');
  }

  static fromExisting(value: SpotStatusValue): SpotStatusVO {
    return new SpotStatusVO(value);
  }

  isFree(): boolean {
    return this.properties === 'FREE';
  }

  isOccupied(): boolean {
    return this.properties === 'OCCUPIED';
  }

  isReserved(): boolean {
    return this.properties === 'RESERVED';
  }

  isUnderMaintenance(): boolean {
    return this.properties === 'MAINTENANCE';
  }

  occupy(spotCodeForError: string): SpotStatusVO {
    if (!this.isFree()) {
      throw new SpotNotFreeError(spotCodeForError);
    }

    return SpotStatusVO.occupied();
  }

  reserve(spotCodeForError: string): SpotStatusVO {
    if (!this.isFree()) {
      throw new SpotNotFreeError(spotCodeForError);
    }

    return SpotStatusVO.reserved();
  }

  release(spotCodeForError: string): SpotStatusVO {
    if (this.isFree() || this.isUnderMaintenance()) {
      throw new SpotNotOccupiedError(spotCodeForError);
    }

    return SpotStatusVO.free();
  }

  enterMaintenance(spotCodeForError: string): SpotStatusVO {
    if (!this.isFree()) {
      throw new SpotNotFreeError(spotCodeForError);
    }

    return SpotStatusVO.maintenance();
  }

  leaveMaintenance(spotCodeForError: string): SpotStatusVO {
    if (!this.isUnderMaintenance()) {
      throw new SpotNotUnderMaintenanceError(spotCodeForError);
    }

    return SpotStatusVO.free();
  }

  serialize(): SpotStatusValue {
    return this.properties;
  }
}
