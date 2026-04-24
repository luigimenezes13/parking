import { AggregateRoot } from '@domain/shared/aggregate-root.ts';
import { type UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { SessionAlreadyFinishedError } from '@domain/parking/errors/session-already-finished.ts';
import { type Vehicle } from '@domain/parking/entities/vehicle.ts';
import { type ParkingSpot } from '@domain/parking/entities/parking-spot.ts';
import { ParkingPeriodVO } from '@domain/parking/value-objects/parking-period-vo.ts';
import { SessionStatusVO } from '@domain/parking/value-objects/session-status-vo.ts';
import { sessionFinishedMapper } from '@domain/parking/aggregates/parking-session/events/session-finished-mapper.ts';
import { sessionStartedMapper } from '@domain/parking/aggregates/parking-session/events/session-started-mapper.ts';
import { spotOccupiedMapper } from '@domain/parking/aggregates/parking-session/events/spot-occupied-mapper.ts';
import { spotReleasedMapper } from '@domain/parking/aggregates/parking-session/events/spot-released-mapper.ts';
import { vehicleEnteredMapper } from '@domain/parking/aggregates/parking-session/events/vehicle-entered-mapper.ts';
import { vehicleExitedMapper } from '@domain/parking/aggregates/parking-session/events/vehicle-exited-mapper.ts';

export interface ParkingSessionProperties {
  vehicle: Vehicle;
  spot: ParkingSpot;
  status: SessionStatusVO;
  period: ParkingPeriodVO;
}

export class ParkingSession extends AggregateRoot<ParkingSessionProperties> {
  constructor(properties: ParkingSessionProperties, identifier?: UniqueIdentifier) {
    super(properties, identifier);
  }

  static open(opening: { vehicle: Vehicle; spot: ParkingSpot; entryAt: Date }): ParkingSession {
    opening.spot.occupyBySession();

    const session = new ParkingSession({
      vehicle: opening.vehicle,
      spot: opening.spot,
      status: SessionStatusVO.active(),
      period: ParkingPeriodVO.startedAt(opening.entryAt),
    });

    session.addDomainEvent(vehicleEnteredMapper.toEvent(session));
    session.addDomainEvent(sessionStartedMapper.toEvent(session));
    session.addDomainEvent(spotOccupiedMapper.toEvent(session));

    return session;
  }

  finish(exitAt: Date): void {
    if (this.properties.status.isFinished()) {
      throw new SessionAlreadyFinishedError(this.identifier.value());
    }

    this.properties.spot.releaseBySession();
    this.properties.period = this.properties.period.closeAt(exitAt);
    this.properties.status = this.properties.status.finish();

    this.addDomainEvent(vehicleExitedMapper.toEvent(this, { exitAt }));
    this.addDomainEvent(sessionFinishedMapper.toEvent(this, { exitAt }));
    this.addDomainEvent(spotReleasedMapper.toEvent(this));
  }

  id(): UniqueIdentifier {
    return this.identifier;
  }

  vehicle(): Vehicle {
    return this.properties.vehicle;
  }

  spot(): ParkingSpot {
    return this.properties.spot;
  }

  status(): SessionStatusVO {
    return this.properties.status;
  }

  period(): ParkingPeriodVO {
    return this.properties.period;
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
}
