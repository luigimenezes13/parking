import { type DomainEventMapper } from '@domain/shared/events/domain-event-mapper.ts';
import { type ParkingSession } from '@domain/parking/aggregates/parking-session/parking-session.ts';
import { type SpotReleased } from '@domain/parking/aggregates/parking-session/events/spot-released.ts';
import { SessionWithoutSpotError } from '@domain/parking/errors/session-without-spot.ts';

export interface SpotReleasedContext {
  releasedAt: Date;
}

export const spotReleasedMapper: DomainEventMapper<
  ParkingSession,
  SpotReleased,
  SpotReleasedContext
> = {
  toEvent(session: ParkingSession, context: SpotReleasedContext): SpotReleased {
    const spot = session.spot();

    if (!spot) {
      throw new SessionWithoutSpotError(session.id().value());
    }

    return Object.freeze({
      eventName: 'parking.session.spot-released',
      occurredOn: new Date(),
      payload: Object.freeze({
        sessionId: session.id().value(),
        spotId: spot.id().value(),
        spotCode: spot.code().value(),
        releasedAt: new Date(context.releasedAt.getTime()),
      }),
    });
  },
};
