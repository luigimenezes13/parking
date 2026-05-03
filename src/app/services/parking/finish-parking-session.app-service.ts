import { inject, injectable } from 'inversify';

import { type AppService } from '@app/shared/app-service.ts';
import { TYPES } from '@app/dto/types.ts';
import { LicensePlateVO } from '@domain/parking/value-objects/license-plate-vo.ts';
import { type DomainEventPublisher } from '@domain/shared/events/domain-event-publisher.ts';
import { type ParkingSession } from '@domain/parking/aggregates/parking-session/parking-session.ts';
import { type ParkingSessionRepository } from '@domain/parking/repositories/parking-session-repository.ts';
import { type ParkingLotResolver } from '@app/services/parking-lot-resolver.ts';
import { ActiveSessionNotFoundError } from '@app/exceptions/recognition/active-session-not-found-error.ts';

export interface FinishParkingSessionInput {
  plate: string | null;
  exitAt: Date;
}

export interface FinishParkingSessionOutput {
  sessionId: string;
}

@injectable()
export class FinishParkingSessionAppService implements AppService<
  FinishParkingSessionInput,
  FinishParkingSessionOutput
> {
  private readonly sessions: ParkingSessionRepository;
  private readonly parkingLots: ParkingLotResolver;
  private readonly publisher: DomainEventPublisher;

  constructor(
    @inject(TYPES.ParkingSessionRepository) sessions: ParkingSessionRepository,
    @inject(TYPES.ParkingLotResolver) parkingLots: ParkingLotResolver,
    @inject(TYPES.DomainEventPublisher) publisher: DomainEventPublisher,
  ) {
    this.sessions = sessions;
    this.parkingLots = parkingLots;
    this.publisher = publisher;
  }

  async execute(input: FinishParkingSessionInput): Promise<FinishParkingSessionOutput> {
    const session = await this.resolveSession(input.plate);

    session.finish({ exitAt: input.exitAt });
    await this.sessions.save(session);
    await this.publisher.publish(session.pullDomainEvents());

    return { sessionId: session.id().value() };
  }

  private async resolveSession(plate: string | null): Promise<ParkingSession> {
    if (plate !== null) {
      const byPlate = await this.sessions.findActiveByPlate(LicensePlateVO.from(plate));
      if (byPlate) {
        return byPlate;
      }
    }

    const fallback = await this.sessions.findMostRecentActive(this.parkingLots.resolveDefault());
    if (fallback) {
      return fallback;
    }

    throw new ActiveSessionNotFoundError(plate ? `plate=${plate}` : 'no plate, no active session');
  }
}
