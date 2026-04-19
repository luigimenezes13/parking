import { type DomainEvent } from './domain-event.ts';

export interface DomainEventMapper<
  Aggregate,
  Event extends DomainEvent<unknown> = DomainEvent,
  Context = void,
> {
  toEvent(aggregate: Aggregate, context?: Context): Event;
}
