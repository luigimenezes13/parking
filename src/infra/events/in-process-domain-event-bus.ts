import { injectable } from 'inversify';

import { type DomainEvent } from '@domain/shared/events/domain-event.ts';

export type DomainEventListener = (event: DomainEvent) => void | Promise<void>;

export interface DomainEventBus {
  subscribe(listener: DomainEventListener): () => void;
  publish(events: DomainEvent[]): void;
}

@injectable()
export class InProcessDomainEventBus implements DomainEventBus {
  private readonly listeners = new Set<DomainEventListener>();

  subscribe(listener: DomainEventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  publish(events: DomainEvent[]): void {
    for (const event of events) {
      for (const listener of this.listeners) {
        try {
          const result = listener(event);
          if (result instanceof Promise) {
            result.catch((error) => this.logFailure(event, error));
          }
        } catch (error) {
          this.logFailure(event, error);
        }
      }
    }
  }

  private logFailure(event: DomainEvent, error: unknown): void {
    const reason = error instanceof Error ? error.message : String(error);
    console.error(
      JSON.stringify({
        level: 'error',
        message: 'domain-event-bus.listener-failed',
        eventName: event.eventName,
        reason,
      }),
    );
  }
}
