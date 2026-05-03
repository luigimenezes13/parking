import { type DomainEventMapper } from '@domain/shared/events/domain-event-mapper.ts';
import { type ParkingSession } from '@domain/parking/aggregates/parking-session/parking-session.ts';
import { type SessionStarted } from '@domain/parking/aggregates/parking-session/events/session-started.ts';

export const sessionStartedMapper: DomainEventMapper<ParkingSession, SessionStarted> = {
  toEvent(session: ParkingSession): SessionStarted {
    const vehicle = session.vehicle();
    return Object.freeze({
      eventName: 'parking.session.started',
      occurredOn: new Date(),
      payload: Object.freeze({
        sessionId: session.id().value(),
        parkingLotId: session.parkingLotId().value(),
        vehicleId: vehicle?.id().value() ?? null,
        licensePlate: vehicle?.licensePlate().value() ?? null,
        entryAt: session.entryAt(),
      }),
    });
  },
};
