import { type DomainEventMapper } from '../../../../shared/events/domain-event-mapper.ts';
import { type ParkingSpot } from '../parking-spot.ts';
import { type SpotRegistered } from './spot-registered.ts';

export const spotRegisteredMapper: DomainEventMapper<ParkingSpot> = {
  toEvent(spot: ParkingSpot): SpotRegistered {
    return Object.freeze({
      eventName: 'parking.spot.registered',
      occurredOn: new Date(),
      payload: Object.freeze({
        spotId: spot.id().value(),
        spotCode: spot.code().value(),
      }),
    });
  },
};
