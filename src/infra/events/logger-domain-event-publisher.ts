import { injectable } from 'inversify';

import { type DomainEvent } from '@domain/shared/events/domain-event.ts';
import { type DomainEventPublisher } from '@domain/shared/events/domain-event-publisher.ts';

@injectable()
export class LoggerDomainEventPublisher implements DomainEventPublisher {
  async publish(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      console.log(
        JSON.stringify({
          level: 'info',
          message: 'domain.event',
          eventName: event.eventName,
          occurredOn: event.occurredOn.toISOString(),
          payload: event.payload,
        }),
      );
    }
  }
}
