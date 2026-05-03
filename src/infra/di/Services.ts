import { type Container } from 'inversify';

import { TYPES } from '@app/dto/types.ts';
import { type DomainEventPublisher } from '@domain/shared/events/domain-event-publisher.ts';
import { type ParkingLotResolver } from '@app/services/parking-lot-resolver.ts';
import { LoggerDomainEventPublisher } from '@infra/events/logger-domain-event-publisher.ts';
import { EnvParkingLotResolver } from '@infra/services/env-parking-lot-resolver.ts';

export function configureServices(container: Container): void {
  container
    .bind<ParkingLotResolver>(TYPES.ParkingLotResolver)
    .to(EnvParkingLotResolver)
    .inSingletonScope();

  container
    .bind<DomainEventPublisher>(TYPES.DomainEventPublisher)
    .to(LoggerDomainEventPublisher)
    .inSingletonScope();
}
