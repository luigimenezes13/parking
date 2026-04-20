import { type DomainEvent } from '@domain/shared/events/domain-event.ts';

export interface SessionFinishedPayload {
  sessionId: string;
  vehicleId: string;
  spotId: string;
  entryAt: Date;
  exitAt: Date;
}

export interface SessionFinished extends DomainEvent<SessionFinishedPayload> {
  readonly eventName: 'parking.session.finished';
}
