import { type DomainEvent } from '@domain/shared/events/domain-event.ts';

export interface SpotReleasedPayload {
  sessionId: string;
  spotId: string;
  spotCode: string;
  releasedAt: Date;
}

export interface SpotReleased extends DomainEvent<SpotReleasedPayload> {
  readonly eventName: 'parking.session.spot-released';
}
