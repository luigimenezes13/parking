import { type DomainEvent } from '@domain/shared/events/domain-event.ts';

export interface SpotReservedPayload {
  spotId: string;
  spotCode: string;
}

export interface SpotReserved extends DomainEvent<SpotReservedPayload> {
  readonly eventName: 'parking.spot.reserved';
}
