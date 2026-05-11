import { inject, injectable } from 'inversify';

import { type UseCase } from '@app/shared/use-case.ts';
import { TYPES } from '@app/dto/types.ts';
import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { type ParkingSession } from '@domain/parking/aggregates/parking-session/parking-session.ts';
import { type ParkingSessionRepository } from '@domain/parking/repositories/parking-session-repository.ts';
import { type VehicleRepository } from '@domain/parking/repositories/vehicle-repository.ts';
import { VehicleNotFoundError } from '@app/exceptions/vehicle/vehicle-not-found-error.ts';

export interface ListSessionsByVehicleInput {
  vehicleId: string;
}

@injectable()
export class ListSessionsByVehicleUseCase implements UseCase<
  ListSessionsByVehicleInput,
  ParkingSession[]
> {
  private readonly sessions: ParkingSessionRepository;
  private readonly vehicles: VehicleRepository;

  constructor(
    @inject(TYPES.ParkingSessionRepository) sessions: ParkingSessionRepository,
    @inject(TYPES.VehicleRepository) vehicles: VehicleRepository,
  ) {
    this.sessions = sessions;
    this.vehicles = vehicles;
  }

  async execute(input: ListSessionsByVehicleInput): Promise<ParkingSession[]> {
    const vehicleId = UniqueIdentifier.fromExisting(input.vehicleId);
    const vehicle = await this.vehicles.findById(vehicleId);
    if (!vehicle) {
      throw new VehicleNotFoundError(input.vehicleId);
    }

    return this.sessions.findByVehicleId(vehicleId);
  }
}
