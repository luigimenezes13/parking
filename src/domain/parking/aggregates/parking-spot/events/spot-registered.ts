import { type DomainEvent } from '../../../../shared/events/domain-event.ts';

export interface SpotRegisteredPayload {
  spotId: string;
  spotCode: string;
}

export interface SpotRegistered extends DomainEvent<SpotRegisteredPayload> {
  readonly eventName: 'parking.spot.registered';
}
