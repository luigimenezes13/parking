import { type DomainEvent } from '@domain/shared/events/domain-event.ts';

export interface SessionFinishedPayload {
  sessionId: string;
  parkingLotId: string;
  vehicleId: string | null;
  licensePlate: string | null;
  entryAt: Date;
  exitAt: Date;
}

export interface SessionFinished extends DomainEvent<SessionFinishedPayload> {
  readonly eventName: 'parking.session.finished';
}
