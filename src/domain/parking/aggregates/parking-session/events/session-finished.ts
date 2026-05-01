import { type DomainEvent } from '@domain/shared/events/domain-event.ts';

export interface SessionFinishedPayload {
  sessionId: string;
  licensePlate: string;
  entryAt: Date;
  exitAt: Date;
}

export interface SessionFinished extends DomainEvent<SessionFinishedPayload> {
  readonly eventName: 'parking.session.finished';
}
