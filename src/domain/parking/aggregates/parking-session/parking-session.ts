import { AggregateRoot } from '@domain/shared/aggregate-root.ts';
import { type UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { SessionAlreadyFinishedError } from '@domain/parking/errors/session-already-finished.ts';
import { SessionNotActiveError } from '@domain/parking/errors/session-not-active.ts';
import { SessionAlreadyHasSpotError } from '@domain/parking/errors/session-already-has-spot.ts';
import { SessionWithoutSpotError } from '@domain/parking/errors/session-without-spot.ts';
import { SessionAlreadyHasVehicleError } from '@domain/parking/errors/session-already-has-vehicle.ts';
import { type Vehicle } from '@domain/parking/entities/vehicle.ts';
import { type ParkingSpot } from '@domain/parking/entities/parking-spot.ts';
import { type LicensePlateVO } from '@domain/parking/value-objects/license-plate-vo.ts';
import { ParkingPeriodVO } from '@domain/parking/value-objects/parking-period-vo.ts';
import { SessionStatusVO } from '@domain/parking/value-objects/session-status-vo.ts';
import { sessionFinishedMapper } from '@domain/parking/aggregates/parking-session/events/session-finished-mapper.ts';
import { sessionStartedMapper } from '@domain/parking/aggregates/parking-session/events/session-started-mapper.ts';
import { spotOccupiedMapper } from '@domain/parking/aggregates/parking-session/events/spot-occupied-mapper.ts';
import { spotReleasedMapper } from '@domain/parking/aggregates/parking-session/events/spot-released-mapper.ts';
import { vehicleEnteredMapper } from '@domain/parking/aggregates/parking-session/events/vehicle-entered-mapper.ts';
import { vehicleExitedMapper } from '@domain/parking/aggregates/parking-session/events/vehicle-exited-mapper.ts';

export interface ParkingSessionProperties {
  parkingLotId: UniqueIdentifier;
  vehicle: Vehicle | null;
  spot: ParkingSpot | null;
  status: SessionStatusVO;
  period: ParkingPeriodVO;
  spotReleasedAt: Date | null;
}

export class ParkingSession extends AggregateRoot<ParkingSessionProperties> {
  constructor(properties: ParkingSessionProperties, identifier?: UniqueIdentifier) {
    super(properties, identifier);
  }

  static enter(opening: {
    parkingLotId: UniqueIdentifier;
    vehicle?: Vehicle | null;
    entryAt: Date;
  }): ParkingSession {
    const session = new ParkingSession({
      parkingLotId: opening.parkingLotId,
      vehicle: opening.vehicle ?? null,
      spot: null,
      status: SessionStatusVO.active(),
      period: ParkingPeriodVO.startedAt(opening.entryAt),
      spotReleasedAt: null,
    });

    session.addDomainEvent(vehicleEnteredMapper.toEvent(session));
    session.addDomainEvent(sessionStartedMapper.toEvent(session));

    return session;
  }

  assignVehicle(assignment: { vehicle: Vehicle }): void {
    this.ensureActive();

    if (this.properties.vehicle !== null) {
      throw new SessionAlreadyHasVehicleError(this.identifier.value());
    }

    this.properties.vehicle = assignment.vehicle;
  }

  assignSpot(assignment: { spot: ParkingSpot; occupiedAt: Date }): void {
    this.ensureActive();

    if (this.properties.spot !== null) {
      throw new SessionAlreadyHasSpotError(this.identifier.value());
    }

    assignment.spot.occupyBySession();
    this.properties.spot = assignment.spot;

    this.addDomainEvent(spotOccupiedMapper.toEvent(this, { occupiedAt: assignment.occupiedAt }));
  }

  releaseSpot(release: { releasedAt: Date }): void {
    this.ensureActive();

    if (this.properties.spot === null) {
      throw new SessionWithoutSpotError(this.identifier.value());
    }

    this.properties.spot.releaseBySession();
    this.properties.spotReleasedAt = new Date(release.releasedAt.getTime());

    this.addDomainEvent(spotReleasedMapper.toEvent(this, { releasedAt: release.releasedAt }));
  }

  finish(closure: { exitAt: Date }): void {
    if (this.properties.status.isFinished()) {
      throw new SessionAlreadyFinishedError(this.identifier.value());
    }

    if (this.properties.spot !== null && this.properties.spot.isOccupied()) {
      this.properties.spot.releaseBySession();
      this.properties.spotReleasedAt = new Date(closure.exitAt.getTime());
      this.addDomainEvent(spotReleasedMapper.toEvent(this, { releasedAt: closure.exitAt }));
    }

    this.properties.period = this.properties.period.closeAt(closure.exitAt);
    this.properties.status = this.properties.status.finish();

    this.addDomainEvent(vehicleExitedMapper.toEvent(this, { exitAt: closure.exitAt }));
    this.addDomainEvent(sessionFinishedMapper.toEvent(this, { exitAt: closure.exitAt }));
  }

  id(): UniqueIdentifier {
    return this.identifier;
  }

  parkingLotId(): UniqueIdentifier {
    return this.properties.parkingLotId;
  }

  vehicle(): Vehicle | null {
    return this.properties.vehicle;
  }

  licensePlate(): LicensePlateVO | null {
    return this.properties.vehicle?.licensePlate() ?? null;
  }

  spot(): ParkingSpot | null {
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

  spotReleasedAt(): Date | null {
    return this.properties.spotReleasedAt
      ? new Date(this.properties.spotReleasedAt.getTime())
      : null;
  }

  isActive(): boolean {
    return this.properties.status.isActive();
  }

  isFinished(): boolean {
    return this.properties.status.isFinished();
  }

  hasVehicleAssigned(): boolean {
    return this.properties.vehicle !== null;
  }

  hasSpotAssigned(): boolean {
    return this.properties.spot !== null;
  }

  isPendingVehicle(): boolean {
    return this.properties.vehicle === null && this.properties.status.isActive();
  }

  isPendingSpot(): boolean {
    return this.properties.spot === null && this.properties.status.isActive();
  }

  private ensureActive(): void {
    if (!this.properties.status.isActive()) {
      throw new SessionNotActiveError(this.identifier.value());
    }
  }
}
