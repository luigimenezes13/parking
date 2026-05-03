import { type DomainEvent } from '@domain/shared/events/domain-event.ts';
import { type DomainEventPublisher } from '@domain/shared/events/domain-event-publisher.ts';

export class InMemoryDomainEventPublisher implements DomainEventPublisher {
  readonly published: DomainEvent[] = [];

  async publish(events: DomainEvent[]): Promise<void> {
    this.published.push(...events);
  }

  pull(): DomainEvent[] {
    return this.published.splice(0, this.published.length);
  }
}
