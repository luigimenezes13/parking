import { type Container } from 'inversify';

import { TYPES } from '@app/dto/types.ts';
import { type DomainEventPublisher } from '@domain/shared/events/domain-event-publisher.ts';
import { type ParkingLotResolver } from '@app/services/parking-lot-resolver.ts';
import { BusDomainEventPublisher } from '@infra/events/bus-domain-event-publisher.ts';
import {
  type DomainEventBus,
  InProcessDomainEventBus,
} from '@infra/events/in-process-domain-event-bus.ts';
import { EnvParkingLotResolver } from '@infra/services/env-parking-lot-resolver.ts';
import {
  type ActivityBroadcaster,
  InMemoryActivityBroadcaster,
} from '@infra/realtime/activity-broadcaster.ts';
import { OfflineCameraSweeper } from '@infra/jobs/offline-camera-sweeper.ts';

export function configureServices(container: Container): void {
  container
    .bind<ParkingLotResolver>(TYPES.ParkingLotResolver)
    .to(EnvParkingLotResolver)
    .inSingletonScope();

  container
    .bind<DomainEventBus>(TYPES.DomainEventBus)
    .to(InProcessDomainEventBus)
    .inSingletonScope();

  container
    .bind<DomainEventPublisher>(TYPES.DomainEventPublisher)
    .to(BusDomainEventPublisher)
    .inSingletonScope();

  container
    .bind<ActivityBroadcaster>(TYPES.ActivityBroadcaster)
    .to(InMemoryActivityBroadcaster)
    .inSingletonScope();

  container.bind<OfflineCameraSweeper>(OfflineCameraSweeper).toSelf().inSingletonScope();
}
