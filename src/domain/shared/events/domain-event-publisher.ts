import { type DomainEvent } from './domain-event.ts';

export interface DomainEventPublisher {
  publish(events: DomainEvent[]): Promise<void>;
}
