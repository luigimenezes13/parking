import { AggregateRoot } from '../../../shared/aggregate-root.ts';
import { UniqueIdentifier } from '../../../shared/value-objects/unique-identifier.ts';
import { SessionAlreadyFinishedError } from '../../errors/session-already-finished.ts';
import { type LicensePlate } from '../../value-objects/license-plate.ts';
import { ParkingPeriod } from '../../value-objects/parking-period.ts';
import { SessionStatus } from '../../value-objects/session-status.ts';
import { type SpotCode } from '../../value-objects/spot-code.ts';
import { vehicleEnteredMapper } from './events/vehicle-entered-mapper.ts';
import { vehicleExitedMapper } from './events/vehicle-exited-mapper.ts';

interface ParkingSessionProperties {
  licensePlate: LicensePlate;
  spotCode: SpotCode;
  status: SessionStatus;
  period: ParkingPeriod;
}

export interface ParkingSessionOpening {
  licensePlate: LicensePlate;
  spotCode: SpotCode;
  entryAt: Date;
}

export interface ParkingSessionRehydration {
  identifier: UniqueIdentifier;
  licensePlate: LicensePlate;
  spotCode: SpotCode;
  status: SessionStatus;
  period: ParkingPeriod;
}

export class ParkingSession extends AggregateRoot<ParkingSessionProperties> {
  private constructor(identifier: UniqueIdentifier, properties: ParkingSessionProperties) {
    super(identifier, properties);
  }

  static open(opening: ParkingSessionOpening): ParkingSession {
    const session = new ParkingSession(UniqueIdentifier.create(), {
      licensePlate: opening.licensePlate,
      spotCode: opening.spotCode,
      status: SessionStatus.active(),
      period: ParkingPeriod.startedAt(opening.entryAt),
    });
    session.addDomainEvent(vehicleEnteredMapper.toEvent(session));
    return session;
  }

  static rehydrate(rehydration: ParkingSessionRehydration): ParkingSession {
    return new ParkingSession(rehydration.identifier, {
      licensePlate: rehydration.licensePlate,
      spotCode: rehydration.spotCode,
      status: rehydration.status,
      period: rehydration.period,
    });
  }

  finish(exitAt: Date): void {
    if (this.properties.status.isFinished()) {
      throw new SessionAlreadyFinishedError(this.identifier.value());
    }

    this.properties.period = this.properties.period.closeAt(exitAt);
    this.properties.status = this.properties.status.finish();
    this.addDomainEvent(vehicleExitedMapper.toEvent(this, { exitAt }));
  }

  id(): UniqueIdentifier {
    return this.identifier;
  }

  licensePlate(): LicensePlate {
    return this.properties.licensePlate;
  }

  spotCode(): SpotCode {
    return this.properties.spotCode;
  }

  status(): SessionStatus {
    return this.properties.status;
  }

  entryAt(): Date {
    return this.properties.period.entryAt();
  }

  exitAt(): Date | null {
    return this.properties.period.exitAt();
  }

  isActive(): boolean {
    return this.properties.status.isActive();
  }

  isFinished(): boolean {
    return this.properties.status.isFinished();
  }

  belongsTo(licensePlate: LicensePlate): boolean {
    return this.properties.licensePlate.equals(licensePlate);
  }

  occupies(spotCode: SpotCode): boolean {
    return this.properties.spotCode.equals(spotCode);
  }
}
