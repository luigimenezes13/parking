import { inject, injectable } from 'inversify';

import { type UseCase } from '@app/shared/use-case.ts';
import { TYPES } from '@app/dto/types.ts';
import { ParkingLotNotFoundError } from '@app/exceptions/parking-lot/parking-lot-not-found-error.ts';
import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import {
  type ActivityDaySummary,
  type ActivityEventRepository,
} from '@domain/activity/repositories/activity-event-repository.ts';
import { type ParkingLotRepository } from '@domain/parking/repositories/parking-lot-repository.ts';

export interface GetActivityDaySummaryInput {
  parkingLotId: string;
  date: Date;
}

@injectable()
export class GetActivityDaySummaryUseCase implements UseCase<
  GetActivityDaySummaryInput,
  ActivityDaySummary
> {
  private readonly activity: ActivityEventRepository;
  private readonly parkingLots: ParkingLotRepository;

  constructor(
    @inject(TYPES.ActivityEventRepository) activity: ActivityEventRepository,
    @inject(TYPES.ParkingLotRepository) parkingLots: ParkingLotRepository,
  ) {
    this.activity = activity;
    this.parkingLots = parkingLots;
  }

  async execute(input: GetActivityDaySummaryInput): Promise<ActivityDaySummary> {
    const lotId = UniqueIdentifier.fromExisting(input.parkingLotId);

    const parkingLot = await this.parkingLots.findById(lotId);
    if (!parkingLot || parkingLot.isDeactivated()) {
      throw new ParkingLotNotFoundError(input.parkingLotId);
    }

    return this.activity.summaryByDay(lotId, input.date);
  }
}
