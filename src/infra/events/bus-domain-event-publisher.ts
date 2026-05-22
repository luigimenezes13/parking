import { inject, injectable } from 'inversify';

import { type DomainEvent } from '@domain/shared/events/domain-event.ts';
import { type DomainEventPublisher } from '@domain/shared/events/domain-event-publisher.ts';
import { TYPES } from '@app/dto/types.ts';
import { type DomainEventBus } from '@infra/events/in-process-domain-event-bus.ts';

@injectable()
export class BusDomainEventPublisher implements DomainEventPublisher {
  private readonly bus: DomainEventBus;

  constructor(@inject(TYPES.DomainEventBus) bus: DomainEventBus) {
    this.bus = bus;
  }

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
    this.bus.publish(events);
  }
}
