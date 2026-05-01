import { type DomainEventMapper } from '@domain/shared/events/domain-event-mapper.ts';
import { type ParkingSession } from '@domain/parking/aggregates/parking-session/parking-session.ts';
import { type SessionStarted } from '@domain/parking/aggregates/parking-session/events/session-started.ts';

export const sessionStartedMapper: DomainEventMapper<ParkingSession, SessionStarted> = {
  toEvent(session: ParkingSession): SessionStarted {
    return Object.freeze({
      eventName: 'parking.session.started',
      occurredOn: new Date(),
      payload: Object.freeze({
        sessionId: session.id().value(),
        vehicleId: session.vehicle().id().value(),
        licensePlate: session.licensePlate().value(),
        entryAt: session.entryAt(),
      }),
    });
  },
};
