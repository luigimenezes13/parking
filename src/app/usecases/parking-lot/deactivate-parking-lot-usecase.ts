import { inject, injectable } from 'inversify';

import { type UseCase } from '@app/shared/use-case.ts';
import { TYPES } from '@app/dto/types.ts';
import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { type ParkingLot } from '@domain/parking/entities/parking-lot.ts';
import { type ParkingLotRepository } from '@domain/parking/repositories/parking-lot-repository.ts';
import { type ParkingSessionRepository } from '@domain/parking/repositories/parking-session-repository.ts';
import { ParkingLotNotFoundError } from '@app/exceptions/parking-lot/parking-lot-not-found-error.ts';
import { ParkingLotHasActiveSessionsError } from '@app/exceptions/parking-lot/parking-lot-has-active-sessions-error.ts';

export interface DeactivateParkingLotInput {
  parkingLotId: string;
}

@injectable()
export class DeactivateParkingLotUseCase implements UseCase<DeactivateParkingLotInput, ParkingLot> {
  private readonly parkingLots: ParkingLotRepository;
  private readonly sessions: ParkingSessionRepository;

  constructor(
    @inject(TYPES.ParkingLotRepository) parkingLots: ParkingLotRepository,
    @inject(TYPES.ParkingSessionRepository) sessions: ParkingSessionRepository,
  ) {
    this.parkingLots = parkingLots;
    this.sessions = sessions;
  }

  async execute(input: DeactivateParkingLotInput): Promise<ParkingLot> {
    const parkingLotId = UniqueIdentifier.fromExisting(input.parkingLotId);
    const parkingLot = await this.parkingLots.findById(parkingLotId);

    if (!parkingLot) {
      throw new ParkingLotNotFoundError(input.parkingLotId);
    }

    const activeSession = await this.sessions.findMostRecentActive(parkingLotId);
    if (activeSession) {
      throw new ParkingLotHasActiveSessionsError(input.parkingLotId);
    }

    parkingLot.deactivate(new Date());
    await this.parkingLots.save(parkingLot);

    return parkingLot;
  }
}
