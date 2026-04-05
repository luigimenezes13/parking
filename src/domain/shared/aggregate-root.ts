import { type DomainEvent } from './events/domain-event.ts';
import { Entity } from './entity.ts';
import { type UniqueIdentifier } from './value-objects/unique-identifier.ts';

export abstract class AggregateRoot<Properties> extends Entity<Properties> {
  private domainEvents: DomainEvent[] = [];

  protected constructor(identifier: UniqueIdentifier, properties: Properties) {
    super(identifier, properties);
  }

  protected addDomainEvent(event: DomainEvent): void {
    this.domainEvents.push(event);
  }

  pullDomainEvents(): DomainEvent[] {
    const events = [...this.domainEvents];
    this.domainEvents = [];
    return events;
  }
}
