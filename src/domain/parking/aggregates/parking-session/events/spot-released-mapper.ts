import { type DomainEventMapper } from '@domain/shared/events/domain-event-mapper.ts';
import { type ParkingSession } from '@domain/parking/aggregates/parking-session/parking-session.ts';
import { type SpotReleased } from '@domain/parking/aggregates/parking-session/events/spot-released.ts';

export const spotReleasedMapper: DomainEventMapper<ParkingSession, SpotReleased> = {
  toEvent(session: ParkingSession): SpotReleased {
    return Object.freeze({
      eventName: 'parking.session.spot-released',
      occurredOn: new Date(),
      payload: Object.freeze({
        sessionId: session.id().value(),
        spotId: session.spot().id().value(),
        spotCode: session.spot().code().value(),
      }),
    });
  },
};
