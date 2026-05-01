import { type DomainEvent } from '@domain/shared/events/domain-event.ts';

export interface SpotOccupiedPayload {
  sessionId: string;
  vehicleId: string;
  licensePlate: string;
  spotId: string;
  spotCode: string;
  occupiedAt: Date;
}

export interface SpotOccupied extends DomainEvent<SpotOccupiedPayload> {
  readonly eventName: 'parking.session.spot-occupied';
}
