import { inject, injectable } from 'inversify';

import { type UseCase } from '@app/shared/use-case.ts';
import { TYPES } from '@app/dto/types.ts';
import { ParkingLotNotFoundError } from '@app/exceptions/parking-lot/parking-lot-not-found-error.ts';
import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import {
  type ActivityEventListResult,
  type ActivityEventRepository,
} from '@domain/activity/repositories/activity-event-repository.ts';
import { type ActivityTypeValue } from '@domain/activity/value-objects/activity-type-vo.ts';
import { type ParkingLotRepository } from '@domain/parking/repositories/parking-lot-repository.ts';

export interface ListActivityEventsInput {
  parkingLotId: string;
  from?: Date;
  to?: Date;
  types?: ActivityTypeValue[];
  plate?: string;
  spotId?: string;
  vehicleId?: string;
  page: number;
  pageSize: number;
}

@injectable()
export class ListActivityEventsUseCase implements UseCase<
  ListActivityEventsInput,
  ActivityEventListResult
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

  async execute(input: ListActivityEventsInput): Promise<ActivityEventListResult> {
    const lotId = UniqueIdentifier.fromExisting(input.parkingLotId);

    const parkingLot = await this.parkingLots.findById(lotId);
    if (!parkingLot || parkingLot.isDeactivated()) {
      throw new ParkingLotNotFoundError(input.parkingLotId);
    }

    return this.activity.listByParkingLot(
      lotId,
      {
        from: input.from,
        to: input.to,
        types: input.types,
        plate: input.plate,
        spotId: input.spotId ? UniqueIdentifier.fromExisting(input.spotId) : undefined,
        vehicleId: input.vehicleId ? UniqueIdentifier.fromExisting(input.vehicleId) : undefined,
      },
      { page: input.page, pageSize: input.pageSize },
    );
  }
}
