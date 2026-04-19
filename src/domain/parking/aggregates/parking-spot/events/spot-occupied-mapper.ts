import { type DomainEventMapper } from '@domain/shared/events/domain-event-mapper.ts';
import { type ParkingSpot } from '@domain/parking/aggregates/parking-spot/parking-spot.ts';
import { type SpotOccupied } from '@domain/parking/aggregates/parking-spot/events/spot-occupied.ts';

export const spotOccupiedMapper: DomainEventMapper<ParkingSpot, SpotOccupied> = {
  toEvent(spot: ParkingSpot): SpotOccupied {
    return Object.freeze({
      eventName: 'parking.spot.occupied',
      occurredOn: new Date(),
      payload: Object.freeze({
        spotId: spot.id().value(),
        spotCode: spot.code().value(),
      }),
    });
  },
};
