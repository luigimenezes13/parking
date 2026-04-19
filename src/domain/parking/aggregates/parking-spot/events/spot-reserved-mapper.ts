import { type DomainEventMapper } from '../../../../shared/events/domain-event-mapper.ts';
import { type ParkingSpot } from '../parking-spot.ts';
import { type SpotReserved } from './spot-reserved.ts';

export const spotReservedMapper: DomainEventMapper<ParkingSpot> = {
  toEvent(spot: ParkingSpot): SpotReserved {
    return Object.freeze({
      eventName: 'parking.spot.reserved',
      occurredOn: new Date(),
      payload: Object.freeze({
        spotId: spot.id().value(),
        spotCode: spot.code().value(),
      }),
    });
  },
};
