import { ValueObject } from '@domain/shared/value-object.ts';
import { InvalidParkingPeriodError } from '@domain/parking/errors/invalid-parking-period.ts';

interface ParkingPeriodVOProperties {
  entryAt: Date;
  exitAt: Date | null;
}

export class ParkingPeriodVO extends ValueObject<ParkingPeriodVOProperties> {
  private constructor(properties: ParkingPeriodVOProperties) {
    super(properties);
  }

  static startedAt(entryAt: Date): ParkingPeriodVO {
    return new ParkingPeriodVO({ entryAt: new Date(entryAt.getTime()), exitAt: null });
  }

  static rehydrate(entryAt: Date, exitAt: Date | null): ParkingPeriodVO {
    if (exitAt && exitAt.getTime() < entryAt.getTime()) {
      throw InvalidParkingPeriodError.exitBeforeEntry(entryAt, exitAt);
    }

    return new ParkingPeriodVO({
      entryAt: new Date(entryAt.getTime()),
      exitAt: exitAt ? new Date(exitAt.getTime()) : null,
    });
  }

  closeAt(exitAt: Date): ParkingPeriodVO {
    if (this.isClosed()) {
      throw InvalidParkingPeriodError.periodAlreadyClosed();
    }

    if (exitAt.getTime() < this.properties.entryAt.getTime()) {
      throw InvalidParkingPeriodError.exitBeforeEntry(this.properties.entryAt, exitAt);
    }

    return new ParkingPeriodVO({
      entryAt: new Date(this.properties.entryAt.getTime()),
      exitAt: new Date(exitAt.getTime()),
    });
  }

  isOpen(): boolean {
    return this.properties.exitAt === null;
  }

  isClosed(): boolean {
    return this.properties.exitAt !== null;
  }

  entryAt(): Date {
    return new Date(this.properties.entryAt.getTime());
  }

  exitAt(): Date | null {
    return this.properties.exitAt ? new Date(this.properties.exitAt.getTime()) : null;
  }
}
