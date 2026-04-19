import { type DomainEventMapper } from '@domain/shared/events/domain-event-mapper.ts';
import { type ParkingSpot } from '@domain/parking/aggregates/parking-spot/parking-spot.ts';
import { type SpotReleased } from '@domain/parking/aggregates/parking-spot/events/spot-released.ts';

export const spotReleasedMapper: DomainEventMapper<ParkingSpot, SpotReleased> = {
  toEvent(spot: ParkingSpot): SpotReleased {
    return Object.freeze({
      eventName: 'parking.spot.released',
      occurredOn: new Date(),
      payload: Object.freeze({
        spotId: spot.id().value(),
        spotCode: spot.code().value(),
      }),
    });
  },
};
