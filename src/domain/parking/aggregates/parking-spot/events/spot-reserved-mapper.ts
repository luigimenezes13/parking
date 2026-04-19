import { type DomainEventMapper } from '@domain/shared/events/domain-event-mapper.ts';
import { type ParkingSpot } from '@domain/parking/aggregates/parking-spot/parking-spot.ts';
import { type SpotReserved } from '@domain/parking/aggregates/parking-spot/events/spot-reserved.ts';

export const spotReservedMapper: DomainEventMapper<ParkingSpot, SpotReserved> = {
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
