import { type DomainEvent } from '@domain/shared/events/domain-event.ts';

export interface SessionStartedPayload {
  sessionId: string;
  parkingLotId: string;
  vehicleId: string | null;
  licensePlate: string | null;
  entryAt: Date;
}

export interface SessionStarted extends DomainEvent<SessionStartedPayload> {
  readonly eventName: 'parking.session.started';
}
