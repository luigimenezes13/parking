import { inject, injectable } from 'inversify';

import { type UseCase } from '@app/shared/use-case.ts';
import { TYPES } from '@app/dto/types.ts';
import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { type ParkingSpot } from '@domain/parking/entities/parking-spot.ts';
import { type ParkingSpotRepository } from '@domain/parking/repositories/parking-spot-repository.ts';
import { type ParkingSessionRepository } from '@domain/parking/repositories/parking-session-repository.ts';
import { ParkingSpotNotFoundError } from '@app/exceptions/parking-spot/parking-spot-not-found-error.ts';
import { SpotHasActiveSessionError } from '@app/exceptions/parking-spot/spot-has-active-session-error.ts';

export interface DeactivateParkingSpotInput {
  parkingSpotId: string;
}

@injectable()
export class DeactivateParkingSpotUseCase implements UseCase<
  DeactivateParkingSpotInput,
  ParkingSpot
> {
  private readonly parkingSpots: ParkingSpotRepository;
  private readonly sessions: ParkingSessionRepository;

  constructor(
    @inject(TYPES.ParkingSpotRepository) parkingSpots: ParkingSpotRepository,
    @inject(TYPES.ParkingSessionRepository) sessions: ParkingSessionRepository,
  ) {
    this.parkingSpots = parkingSpots;
    this.sessions = sessions;
  }

  async execute(input: DeactivateParkingSpotInput): Promise<ParkingSpot> {
    const spotId = UniqueIdentifier.fromExisting(input.parkingSpotId);
    const spot = await this.parkingSpots.findById(spotId);

    if (!spot) {
      throw new ParkingSpotNotFoundError(input.parkingSpotId);
    }

    const activeSession = await this.sessions.findActiveBySpot(spotId);
    if (activeSession) {
      throw new SpotHasActiveSessionError(input.parkingSpotId);
    }

    spot.deactivate(new Date());
    await this.parkingSpots.save(spot);

    return spot;
  }
}
