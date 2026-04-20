import { type DomainEventMapper } from '@domain/shared/events/domain-event-mapper.ts';
import { type ParkingSession } from '@domain/parking/aggregates/parking-session/parking-session.ts';
import { type SessionFinished } from '@domain/parking/aggregates/parking-session/events/session-finished.ts';

export interface SessionFinishedContext {
  exitAt: Date;
}

export const sessionFinishedMapper: DomainEventMapper<
  ParkingSession,
  SessionFinished,
  SessionFinishedContext
> = {
  toEvent(session: ParkingSession, context: SessionFinishedContext): SessionFinished {
    return Object.freeze({
      eventName: 'parking.session.finished',
      occurredOn: new Date(),
      payload: Object.freeze({
        sessionId: session.id().value(),
        vehicleId: session.vehicle().id().value(),
        spotId: session.spot().id().value(),
        entryAt: session.entryAt(),
        exitAt: new Date(context.exitAt.getTime()),
      }),
    });
  },
};
