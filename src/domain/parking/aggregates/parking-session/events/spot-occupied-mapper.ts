import { type DomainEventMapper } from '@domain/shared/events/domain-event-mapper.ts';
import { type ParkingSession } from '@domain/parking/aggregates/parking-session/parking-session.ts';
import { type SpotOccupied } from '@domain/parking/aggregates/parking-session/events/spot-occupied.ts';

export const spotOccupiedMapper: DomainEventMapper<ParkingSession, SpotOccupied> = {
  toEvent(session: ParkingSession): SpotOccupied {
    return Object.freeze({
      eventName: 'parking.session.spot-occupied',
      occurredOn: new Date(),
      payload: Object.freeze({
        sessionId: session.id().value(),
        spotId: session.spot().id().value(),
        spotCode: session.spot().code().value(),
      }),
    });
  },
};
