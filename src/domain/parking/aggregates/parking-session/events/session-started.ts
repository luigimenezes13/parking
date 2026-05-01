import { type DomainEvent } from '@domain/shared/events/domain-event.ts';

export interface SessionStartedPayload {
  sessionId: string;
  licensePlate: string;
  entryAt: Date;
}

export interface SessionStarted extends DomainEvent<SessionStartedPayload> {
  readonly eventName: 'parking.session.started';
}
