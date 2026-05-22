import { inject, injectable } from 'inversify';

import { type UseCase } from '@app/shared/use-case.ts';
import { TYPES } from '@app/dto/types.ts';
import { ParkingSpotNotFoundError } from '@app/exceptions/parking-spot/parking-spot-not-found-error.ts';
import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { type ParkingSpot } from '@domain/parking/entities/parking-spot.ts';
import { type ParkingSpotRepository } from '@domain/parking/repositories/parking-spot-repository.ts';
import { type DomainEventPublisher } from '@domain/shared/events/domain-event-publisher.ts';
import { createSpotMaintenanceEnded } from '@domain/parking/events/spot-maintenance-ended.ts';

export interface LeaveSpotMaintenanceInput {
  parkingSpotId: string;
}

@injectable()
export class LeaveSpotMaintenanceUseCase implements UseCase<
  LeaveSpotMaintenanceInput,
  ParkingSpot
> {
  private readonly spots: ParkingSpotRepository;
  private readonly publisher: DomainEventPublisher;

  constructor(
    @inject(TYPES.ParkingSpotRepository) spots: ParkingSpotRepository,
    @inject(TYPES.DomainEventPublisher) publisher: DomainEventPublisher,
  ) {
    this.spots = spots;
    this.publisher = publisher;
  }

  async execute(input: LeaveSpotMaintenanceInput): Promise<ParkingSpot> {
    const spot = await this.spots.findById(UniqueIdentifier.fromExisting(input.parkingSpotId));
    if (!spot || spot.isDeactivated()) {
      throw new ParkingSpotNotFoundError(input.parkingSpotId);
    }

    if (!spot.isUnderMaintenance()) {
      return spot;
    }

    const endedAt = new Date();
    spot.leaveMaintenance();
    await this.spots.save(spot);

    await this.publisher.publish([
      createSpotMaintenanceEnded({
        spotId: spot.id().value(),
        spotCode: spot.code().value(),
        parkingLotId: spot.parkingLotId().value(),
        endedAt,
      }),
    ]);

    return spot;
  }
}
