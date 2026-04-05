export interface DomainEvent<Payload = Record<string, unknown>> {
  readonly occurredOn: Date;
  readonly eventName: string;
  readonly payload: Payload;
}
