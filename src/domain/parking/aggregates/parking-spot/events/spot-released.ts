import { type DomainEvent } from '../../../../shared/events/domain-event.ts';

export interface SpotReleasedPayload {
  spotId: string;
  spotCode: string;
}

export interface SpotReleased extends DomainEvent<SpotReleasedPayload> {
  readonly eventName: 'parking.spot.released';
}
