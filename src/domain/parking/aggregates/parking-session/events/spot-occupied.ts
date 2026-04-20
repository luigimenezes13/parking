import { type DomainEvent } from '@domain/shared/events/domain-event.ts';

export interface SpotOccupiedPayload {
  sessionId: string;
  spotId: string;
  spotCode: string;
}

export interface SpotOccupied extends DomainEvent<SpotOccupiedPayload> {
  readonly eventName: 'parking.session.spot-occupied';
}
