import { type DomainEvent } from '@domain/shared/events/domain-event.ts';

export interface SessionStartedPayload {
  sessionId: string;
  vehicleId: string;
  spotId: string;
  entryAt: Date;
}

export interface SessionStarted extends DomainEvent<SessionStartedPayload> {
  readonly eventName: 'parking.session.started';
}
