import { type DomainEvent } from '@domain/shared/events/domain-event.ts';

export interface SpotOccupiedPayload {
  sessionId: string;
  vehicleId: string | null;
  licensePlate: string | null;
  spotId: string;
  spotCode: string;
  occupiedAt: Date;
}

export interface SpotOccupied extends DomainEvent<SpotOccupiedPayload> {
  readonly eventName: 'parking.session.spot-occupied';
}
