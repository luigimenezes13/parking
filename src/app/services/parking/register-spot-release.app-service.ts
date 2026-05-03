import { inject, injectable } from 'inversify';

import { type AppService } from '@app/shared/app-service.ts';
import { TYPES } from '@app/dto/types.ts';
import { LicensePlateVO } from '@domain/parking/value-objects/license-plate-vo.ts';
import { SpotCodeVO } from '@domain/parking/value-objects/spot-code-vo.ts';
import { type UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { type DomainEventPublisher } from '@domain/shared/events/domain-event-publisher.ts';
import { type ParkingSession } from '@domain/parking/aggregates/parking-session/parking-session.ts';
import { type ParkingSessionRepository } from '@domain/parking/repositories/parking-session-repository.ts';
import { type ParkingSpotRepository } from '@domain/parking/repositories/parking-spot-repository.ts';
import { type ParkingLotResolver } from '@app/services/parking-lot-resolver.ts';
import { ActiveSessionNotFoundError } from '@app/exceptions/recognition/active-session-not-found-error.ts';
import { ParkingSpotNotFoundError } from '@app/exceptions/recognition/parking-spot-not-found-error.ts';

export interface RegisterSpotReleaseInput {
  plate: string | null;
  spotCode: string;
  releasedAt: Date;
}

export interface RegisterSpotReleaseOutput {
  sessionId: string;
}

@injectable()
export class RegisterSpotReleaseAppService
  implements AppService<RegisterSpotReleaseInput, RegisterSpotReleaseOutput>
{
  private readonly spots: ParkingSpotRepository;
  private readonly sessions: ParkingSessionRepository;
  private readonly parkingLots: ParkingLotResolver;
  private readonly publisher: DomainEventPublisher;

  constructor(
    @inject(TYPES.ParkingSpotRepository) spots: ParkingSpotRepository,
    @inject(TYPES.ParkingSessionRepository) sessions: ParkingSessionRepository,
    @inject(TYPES.ParkingLotResolver) parkingLots: ParkingLotResolver,
    @inject(TYPES.DomainEventPublisher) publisher: DomainEventPublisher,
  ) {
    this.spots = spots;
    this.sessions = sessions;
    this.parkingLots = parkingLots;
    this.publisher = publisher;
  }

  async execute(input: RegisterSpotReleaseInput): Promise<RegisterSpotReleaseOutput> {
    const spotCode = SpotCodeVO.from(input.spotCode);
    const parkingLotId = this.parkingLots.resolveDefault();

    const spot = await this.spots.findByCode(parkingLotId, spotCode);
    if (!spot) {
      throw new ParkingSpotNotFoundError(parkingLotId.value(), input.spotCode);
    }

    const session = await this.resolveSession(input.plate, spot.id());
    session.releaseSpot({ releasedAt: input.releasedAt });
    await this.sessions.save(session);
    await this.publisher.publish(session.pullDomainEvents());

    return { sessionId: session.id().value() };
  }

  private async resolveSession(
    plate: string | null,
    spotId: UniqueIdentifier,
  ): Promise<ParkingSession> {
    if (plate !== null) {
      const byPlate = await this.sessions.findActiveByPlate(LicensePlateVO.from(plate));
      if (byPlate) {
        return byPlate;
      }
    }

    const bySpot = await this.sessions.findActiveBySpot(spotId);
    if (bySpot) {
      return bySpot;
    }

    throw new ActiveSessionNotFoundError(plate ? `plate=${plate}` : `spotId=${spotId.value()}`);
  }
}
