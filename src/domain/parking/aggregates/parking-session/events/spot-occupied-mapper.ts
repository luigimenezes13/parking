import { type DomainEventMapper } from '@domain/shared/events/domain-event-mapper.ts';
import { type ParkingSession } from '@domain/parking/aggregates/parking-session/parking-session.ts';
import { type SpotOccupied } from '@domain/parking/aggregates/parking-session/events/spot-occupied.ts';
import { SessionWithoutSpotError } from '@domain/parking/errors/session-without-spot.ts';

export interface SpotOccupiedContext {
  occupiedAt: Date;
}

export const spotOccupiedMapper: DomainEventMapper<
  ParkingSession,
  SpotOccupied,
  SpotOccupiedContext
> = {
  toEvent(session: ParkingSession, context: SpotOccupiedContext): SpotOccupied {
    const vehicle = session.vehicle();
    const spot = session.spot();

    if (!vehicle || !spot) {
      throw new SessionWithoutSpotError(session.id().value());
    }

    return Object.freeze({
      eventName: 'parking.session.spot-occupied',
      occurredOn: new Date(),
      payload: Object.freeze({
        sessionId: session.id().value(),
        vehicleId: vehicle.id().value(),
        licensePlate: vehicle.licensePlate().value(),
        spotId: spot.id().value(),
        spotCode: spot.code().value(),
        occupiedAt: new Date(context.occupiedAt.getTime()),
      }),
    });
  },
};
