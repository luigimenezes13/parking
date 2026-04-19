import { type DomainEventMapper } from '@domain/shared/events/domain-event-mapper.ts';
import { type ParkingSpot } from '@domain/parking/aggregates/parking-spot/parking-spot.ts';
import { type SpotRegistered } from '@domain/parking/aggregates/parking-spot/events/spot-registered.ts';

export const spotRegisteredMapper: DomainEventMapper<ParkingSpot, SpotRegistered> = {
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
