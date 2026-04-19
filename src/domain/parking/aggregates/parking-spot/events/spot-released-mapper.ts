import { type DomainEventMapper } from '../../../../shared/events/domain-event-mapper.ts';
import { type ParkingSpot } from '../parking-spot.ts';
import { type SpotReleased } from './spot-released.ts';

export const spotReleasedMapper: DomainEventMapper<ParkingSpot> = {
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
