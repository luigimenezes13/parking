export interface DomainEvent<Payload = unknown> {
  readonly occurredOn: Date;
  readonly eventName: string;
  readonly payload: Payload;
}
