import { describe, expect, it } from 'vitest';

import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { ParkingSession } from '@domain/parking/aggregates/parking-session/parking-session.ts';
import { SessionAlreadyFinishedError } from '@domain/parking/errors/session-already-finished.ts';
import { SessionAlreadyHasSpotError } from '@domain/parking/errors/session-already-has-spot.ts';
import { SessionAlreadyHasVehicleError } from '@domain/parking/errors/session-already-has-vehicle.ts';
import { SessionNotActiveError } from '@domain/parking/errors/session-not-active.ts';
import { SessionWithoutSpotError } from '@domain/parking/errors/session-without-spot.ts';
import { makeVehicle } from '@domain/parking/__tests__/factories/vehicle.factory.ts';
import { makeParkingSpot } from '@domain/parking/__tests__/factories/parking-spot.factory.ts';
import { makeActiveSession } from '@domain/parking/__tests__/factories/parking-session.factory.ts';

const PARKING_LOT_ID = UniqueIdentifier.fromExisting('11111111-1111-4111-8111-111111111111');

describe('ParkingSession.enter (with vehicle)', () => {
  it('should create an ACTIVE session pending spot when entry is registered', () => {
    const session = ParkingSession.enter({
      parkingLotId: PARKING_LOT_ID,
      vehicle: makeVehicle(),
      entryAt: new Date('2026-04-30T10:00:00Z'),
    });

    expect(session.isActive()).toBe(true);
    expect(session.isPendingSpot()).toBe(true);
  });

  it('should expose the license plate from the entering vehicle', () => {
    const vehicle = makeVehicle({ licensePlate: 'ABC1D23' });
    const session = ParkingSession.enter({
      parkingLotId: PARKING_LOT_ID,
      vehicle,
      entryAt: new Date('2026-04-30T10:00:00Z'),
    });

    expect(session.licensePlate()?.value()).toBe('ABC1D23');
  });

  it('should keep spot null until a spot is assigned', () => {
    const session = makeActiveSession();
    expect(session.spot()).toBeNull();
  });

  it('should emit VehicleEntered followed by SessionStarted on enter', () => {
    const session = ParkingSession.enter({
      parkingLotId: PARKING_LOT_ID,
      vehicle: makeVehicle(),
      entryAt: new Date('2026-04-30T10:00:00Z'),
    });

    const eventNames = session.pullDomainEvents().map((event) => event.eventName);
    expect(eventNames).toEqual(['parking.session.vehicle-entered', 'parking.session.started']);
  });
});

describe('ParkingSession.enter (pending vehicle)', () => {
  it('should create a session with vehicle null when plate is unknown', () => {
    const session = ParkingSession.enter({
      parkingLotId: PARKING_LOT_ID,
      entryAt: new Date('2026-04-30T10:00:00Z'),
    });

    expect(session.vehicle()).toBeNull();
    expect(session.isPendingVehicle()).toBe(true);
  });

  it('should report null license plate when vehicle is unresolved', () => {
    const session = ParkingSession.enter({
      parkingLotId: PARKING_LOT_ID,
      entryAt: new Date('2026-04-30T10:00:00Z'),
    });

    expect(session.licensePlate()).toBeNull();
  });

  it('should still emit VehicleEntered + SessionStarted when entering pending', () => {
    const session = ParkingSession.enter({
      parkingLotId: PARKING_LOT_ID,
      entryAt: new Date('2026-04-30T10:00:00Z'),
    });

    const eventNames = session.pullDomainEvents().map((event) => event.eventName);
    expect(eventNames).toEqual(['parking.session.vehicle-entered', 'parking.session.started']);
  });
});

describe('ParkingSession.assignVehicle', () => {
  it('should attach a vehicle to a pending session', () => {
    const session = makeActiveSession({ vehicle: null });
    const vehicle = makeVehicle({ parkingLotId: PARKING_LOT_ID, licensePlate: 'ABC1D23' });

    session.assignVehicle({ vehicle });

    expect(session.vehicle()?.id().equals(vehicle.id())).toBe(true);
    expect(session.licensePlate()?.value()).toBe('ABC1D23');
  });

  it('should throw SessionAlreadyHasVehicleError when vehicle is already assigned', () => {
    const session = makeActiveSession();

    expect(() => session.assignVehicle({ vehicle: makeVehicle() })).toThrow(
      SessionAlreadyHasVehicleError,
    );
  });

  it('should throw SessionNotActiveError when session is finished', () => {
    const session = makeActiveSession({ vehicle: null });
    session.finish({ exitAt: new Date('2026-04-30T11:00:00Z') });
    session.pullDomainEvents();

    expect(() => session.assignVehicle({ vehicle: makeVehicle() })).toThrow(SessionNotActiveError);
  });
});

describe('ParkingSession.assignSpot', () => {
  it('should attach the spot to a pending session', () => {
    const session = makeActiveSession();
    const spot = makeParkingSpot({ code: 'A' });

    session.assignSpot({ spot, occupiedAt: new Date('2026-04-30T10:00:30Z') });

    expect(session.spot()?.code().value()).toBe('A');
    expect(session.hasSpotAssigned()).toBe(true);
  });

  it('should mark the spot as occupied after assignment', () => {
    const session = makeActiveSession();
    const spot = makeParkingSpot({ code: 'A' });

    session.assignSpot({ spot, occupiedAt: new Date('2026-04-30T10:00:30Z') });

    expect(spot.isOccupied()).toBe(true);
  });

  it('should emit SpotOccupied as the only event of assignSpot', () => {
    const session = makeActiveSession();

    session.assignSpot({ spot: makeParkingSpot(), occupiedAt: new Date('2026-04-30T10:00:30Z') });

    const eventNames = session.pullDomainEvents().map((event) => event.eventName);
    expect(eventNames).toEqual(['parking.session.spot-occupied']);
  });

  it('should throw SessionAlreadyHasSpotError when called twice', () => {
    const session = makeActiveSession();
    session.assignSpot({ spot: makeParkingSpot({ code: 'A' }), occupiedAt: new Date() });
    session.pullDomainEvents();

    expect(() =>
      session.assignSpot({ spot: makeParkingSpot({ code: 'B' }), occupiedAt: new Date() }),
    ).toThrow(SessionAlreadyHasSpotError);
  });

  it('should throw SessionNotActiveError when session is finished', () => {
    const session = makeActiveSession();
    session.finish({ exitAt: new Date('2026-04-30T11:00:00Z') });
    session.pullDomainEvents();

    expect(() => session.assignSpot({ spot: makeParkingSpot(), occupiedAt: new Date() })).toThrow(
      SessionNotActiveError,
    );
  });
});

describe('ParkingSession.releaseSpot', () => {
  it('should free the spot when releasing an assigned session', () => {
    const session = makeActiveSession();
    const spot = makeParkingSpot();
    session.assignSpot({ spot, occupiedAt: new Date('2026-04-30T10:00:30Z') });
    session.pullDomainEvents();

    session.releaseSpot({ releasedAt: new Date('2026-04-30T11:00:00Z') });

    expect(spot.isFree()).toBe(true);
  });

  it('should record spotReleasedAt when releasing the spot', () => {
    const session = makeActiveSession();
    session.assignSpot({ spot: makeParkingSpot(), occupiedAt: new Date('2026-04-30T10:00:30Z') });
    session.pullDomainEvents();
    const releasedAt = new Date('2026-04-30T11:00:00Z');

    session.releaseSpot({ releasedAt });

    expect(session.spotReleasedAt()?.toISOString()).toBe(releasedAt.toISOString());
  });

  it('should keep session ACTIVE after releasing the spot', () => {
    const session = makeActiveSession();
    session.assignSpot({ spot: makeParkingSpot(), occupiedAt: new Date('2026-04-30T10:00:30Z') });
    session.pullDomainEvents();

    session.releaseSpot({ releasedAt: new Date('2026-04-30T11:00:00Z') });

    expect(session.isActive()).toBe(true);
  });

  it('should emit SpotReleased as the only event of releaseSpot', () => {
    const session = makeActiveSession();
    session.assignSpot({ spot: makeParkingSpot(), occupiedAt: new Date('2026-04-30T10:00:30Z') });
    session.pullDomainEvents();

    session.releaseSpot({ releasedAt: new Date('2026-04-30T11:00:00Z') });

    const eventNames = session.pullDomainEvents().map((event) => event.eventName);
    expect(eventNames).toEqual(['parking.session.spot-released']);
  });

  it('should throw SessionWithoutSpotError when no spot has been assigned', () => {
    const session = makeActiveSession();

    expect(() => session.releaseSpot({ releasedAt: new Date() })).toThrow(SessionWithoutSpotError);
  });
});

describe('ParkingSession.finish', () => {
  it('should mark session as FINISHED when called on an active session', () => {
    const session = makeActiveSession();

    session.finish({ exitAt: new Date('2026-04-30T11:00:00Z') });

    expect(session.isFinished()).toBe(true);
  });

  it('should record exitAt in the period when finishing', () => {
    const session = makeActiveSession();
    const exitAt = new Date('2026-04-30T11:00:00Z');

    session.finish({ exitAt });

    expect(session.exitAt()?.toISOString()).toBe(exitAt.toISOString());
  });

  it('should emit VehicleExited followed by SessionFinished after a regular release', () => {
    const session = makeActiveSession();
    session.assignSpot({ spot: makeParkingSpot(), occupiedAt: new Date('2026-04-30T10:00:30Z') });
    session.releaseSpot({ releasedAt: new Date('2026-04-30T11:00:00Z') });
    session.pullDomainEvents();

    session.finish({ exitAt: new Date('2026-04-30T11:00:30Z') });

    const eventNames = session.pullDomainEvents().map((event) => event.eventName);
    expect(eventNames).toEqual(['parking.session.vehicle-exited', 'parking.session.finished']);
  });

  it('should release a still-occupied spot defensively when finish runs without releaseSpot', () => {
    const session = makeActiveSession();
    const spot = makeParkingSpot();
    session.assignSpot({ spot, occupiedAt: new Date('2026-04-30T10:00:30Z') });
    session.pullDomainEvents();

    session.finish({ exitAt: new Date('2026-04-30T11:00:00Z') });

    expect(spot.isFree()).toBe(true);
  });

  it('should emit SpotReleased before VehicleExited when finish runs without releaseSpot', () => {
    const session = makeActiveSession();
    session.assignSpot({ spot: makeParkingSpot(), occupiedAt: new Date('2026-04-30T10:00:30Z') });
    session.pullDomainEvents();

    session.finish({ exitAt: new Date('2026-04-30T11:00:00Z') });

    const eventNames = session.pullDomainEvents().map((event) => event.eventName);
    expect(eventNames).toEqual([
      'parking.session.spot-released',
      'parking.session.vehicle-exited',
      'parking.session.finished',
    ]);
  });

  it('should finish a session that never received a spot (lossy spot.occupied)', () => {
    const session = makeActiveSession();

    session.finish({ exitAt: new Date('2026-04-30T11:00:00Z') });

    expect(session.isFinished()).toBe(true);
    expect(session.spot()).toBeNull();
  });

  it('should finish a session that has no vehicle (pending vehicle case)', () => {
    const session = makeActiveSession({ vehicle: null });

    session.finish({ exitAt: new Date('2026-04-30T11:00:00Z') });

    expect(session.isFinished()).toBe(true);
    expect(session.vehicle()).toBeNull();
  });

  it('should throw SessionAlreadyFinishedError when finish is called twice', () => {
    const session = makeActiveSession();
    session.finish({ exitAt: new Date('2026-04-30T11:00:00Z') });

    expect(() => session.finish({ exitAt: new Date('2026-04-30T12:00:00Z') })).toThrow(
      SessionAlreadyFinishedError,
    );
  });
});
