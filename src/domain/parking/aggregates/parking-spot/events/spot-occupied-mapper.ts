import { type DomainEventMapper } from '../../../../shared/events/domain-event-mapper.ts';
import { type ParkingSpot } from '../parking-spot.ts';
import { type SpotOccupied } from './spot-occupied.ts';

export const spotOccupiedMapper: DomainEventMapper<ParkingSpot> = {
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
