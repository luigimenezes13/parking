import { inject, injectable } from 'inversify';

import { type UseCase } from '@app/shared/use-case.ts';
import { TYPES } from '@app/dto/types.ts';
import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { type ParkingSession } from '@domain/parking/aggregates/parking-session/parking-session.ts';
import { type ParkingLotRepository } from '@domain/parking/repositories/parking-lot-repository.ts';
import { type ParkingSessionRepository } from '@domain/parking/repositories/parking-session-repository.ts';
import { ParkingLotNotFoundError } from '@app/exceptions/parking-lot/parking-lot-not-found-error.ts';

export interface ListActiveSessionsByLotInput {
  parkingLotId: string;
}

@injectable()
export class ListActiveSessionsByLotUseCase implements UseCase<
  ListActiveSessionsByLotInput,
  ParkingSession[]
> {
  private readonly sessions: ParkingSessionRepository;
  private readonly parkingLots: ParkingLotRepository;

  constructor(
    @inject(TYPES.ParkingSessionRepository) sessions: ParkingSessionRepository,
    @inject(TYPES.ParkingLotRepository) parkingLots: ParkingLotRepository,
  ) {
    this.sessions = sessions;
    this.parkingLots = parkingLots;
  }

  async execute(input: ListActiveSessionsByLotInput): Promise<ParkingSession[]> {
    const parkingLotId = UniqueIdentifier.fromExisting(input.parkingLotId);
    const parkingLot = await this.parkingLots.findById(parkingLotId);
    if (!parkingLot) {
      throw new ParkingLotNotFoundError(input.parkingLotId);
    }

    return this.sessions.findActiveByLot(parkingLotId);
  }
}
