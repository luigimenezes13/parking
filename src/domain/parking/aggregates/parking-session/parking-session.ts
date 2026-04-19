import { AggregateRoot } from '@domain/shared/aggregate-root.ts';
import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { SessionAlreadyFinishedError } from '@domain/parking/errors/session-already-finished.ts';
import { type LicensePlateVO } from '@domain/parking/value-objects/license-plate-vo.ts';
import { ParkingPeriodVO } from '@domain/parking/value-objects/parking-period-vo.ts';
import { SessionStatusVO } from '@domain/parking/value-objects/session-status-vo.ts';
import { type SpotCodeVO } from '@domain/parking/value-objects/spot-code-vo.ts';
import { vehicleEnteredMapper } from '@domain/parking/aggregates/parking-session/events/vehicle-entered-mapper.ts';
import { vehicleExitedMapper } from '@domain/parking/aggregates/parking-session/events/vehicle-exited-mapper.ts';

interface ParkingSessionProperties {
  licensePlate: LicensePlateVO;
  spotCode: SpotCodeVO;
  status: SessionStatusVO;
  period: ParkingPeriodVO;
}

export interface ParkingSessionOpening {
  licensePlate: LicensePlateVO;
  spotCode: SpotCodeVO;
  entryAt: Date;
}

export interface ParkingSessionRehydration {
  identifier: UniqueIdentifier;
  licensePlate: LicensePlateVO;
  spotCode: SpotCodeVO;
  status: SessionStatusVO;
  period: ParkingPeriodVO;
}

export class ParkingSession extends AggregateRoot<ParkingSessionProperties> {
  private constructor(identifier: UniqueIdentifier, properties: ParkingSessionProperties) {
    super(identifier, properties);
  }

  static open(opening: ParkingSessionOpening): ParkingSession {
    const session = new ParkingSession(UniqueIdentifier.create(), {
      licensePlate: opening.licensePlate,
      spotCode: opening.spotCode,
      status: SessionStatusVO.active(),
      period: ParkingPeriodVO.startedAt(opening.entryAt),
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

  licensePlate(): LicensePlateVO {
    return this.properties.licensePlate;
  }

  spotCode(): SpotCodeVO {
    return this.properties.spotCode;
  }

  status(): SessionStatusVO {
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

  belongsTo(licensePlate: LicensePlateVO): boolean {
    return this.properties.licensePlate.equals(licensePlate);
  }

  occupies(spotCode: SpotCodeVO): boolean {
    return this.properties.spotCode.equals(spotCode);
  }
}
