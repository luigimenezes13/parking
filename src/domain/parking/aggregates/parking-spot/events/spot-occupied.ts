import { type DomainEvent } from '../../../../shared/events/domain-event.ts';

export interface SpotOccupiedPayload {
  spotId: string;
  spotCode: string;
}

export interface SpotOccupied extends DomainEvent<SpotOccupiedPayload> {
  readonly eventName: 'parking.spot.occupied';
}
